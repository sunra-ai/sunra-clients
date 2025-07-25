from __future__ import annotations

import asyncio
import base64
from dataclasses import dataclass, field
from functools import cached_property
import io
import logging
import mimetypes
import os
import re
import time
from typing import TYPE_CHECKING, Any, AsyncIterator, Callable, Dict, Iterator, Union
from urllib.parse import urlencode

import anyio
import httpx
from httpx_sse import aconnect_sse, connect_sse
import requests

from sunra_client.auth import SUNRA_HOST, fetch_credentials

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from PIL import Image

AnyJSON = Dict[str, Any]

QUEUE_URL_FORMAT = f"https://api.{SUNRA_HOST}/v1/queue/"
USER_AGENT = "sunra-client/0.1.0 (python)"

# Regex pattern for data URIs
DATA_URI_PATTERN = re.compile(r'^data:[^;]+;base64,')


class SunraClientError(Exception):
    """Exception raised when Sunra API operations fail."""

    def __init__(
        self,
        message: str,
        code: str | None = None,
        error_type: str | None = None,
        details: dict[str, Any] | None = None,
        timestamp: str | None = None,
        request_id: str | None = None,
        rate_limit: dict[str, int] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.type = error_type
        self.details = details
        self.timestamp = timestamp
        self.request_id = request_id
        self.rate_limit = rate_limit

    def to_dict(self) -> dict:
        """Convert error to dictionary format matching API response structure."""
        error_obj = {
            "code": self.code or "UNKNOWN_ERROR",
            "message": self.message
        }

        if self.type:
            error_obj["type"] = self.type
        if self.details:
            error_obj["details"] = self.details

        result = {"error": error_obj}

        if self.timestamp:
            result["timestamp"] = self.timestamp
        if self.request_id:
            result["request_id"] = self.request_id
        if self.rate_limit:
            result["rate_limit"] = self.rate_limit

        return result

    def __str__(self) -> str:
        parts = []
        if self.code:
            parts.append(self.code)
        if self.message:
            parts.append(self.message)
        if self.details:
            parts.append(f"Details: {self.details}")
        if self.timestamp:
            parts.append(f"Timestamp: {self.timestamp}")
        if self.request_id:
            parts.append(f"Request ID: {self.request_id}")
        return " | ".join(parts)


def _extract_rate_limit_from_headers(headers) -> dict[str, int] | None:
    """Extract rate limit information from response headers."""
    try:
        limit = headers.get('x-ratelimit-limit')
        remaining = headers.get('x-ratelimit-remaining')
        reset = headers.get('x-ratelimit-reset')

        if limit is not None and remaining is not None and reset is not None:
            return {
                'limit': int(limit),
                'remaining': int(remaining),
                'reset': int(reset)
            }
    except (ValueError, TypeError):
        pass

    return None


def _raise_for_status(response: httpx.Response) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        request_id = response.headers.get('x-request-id')
        rate_limit = _extract_rate_limit_from_headers(response.headers)

        try:
            error_data = response.json()

            # Check if there's a nested error object (common API pattern)
            if "error" in error_data and isinstance(error_data["error"], dict):
                error_obj = error_data["error"]
                message = error_obj.get("message", "Request failed")
                code = error_obj.get("code", str(response.status_code))
                error_type = error_obj.get("type")
                details = error_obj.get("details")
                timestamp = error_data.get("timestamp")
            else:
                # Fallback to top-level fields for legacy responses
                message = error_data.get("detail", response.text)
                code = error_data.get("code", str(response.status_code))
                error_type = error_data.get("type")
                details = error_data.get("details")
                timestamp = error_data.get("timestamp")

        except (ValueError, KeyError):
            message = response.text or f"HTTP {response.status_code}"
            code = str(response.status_code)
            error_type = "network_error"
            details = {"status_code": response.status_code, "response_text": response.text}
            timestamp = None

        raise SunraClientError(
            message=message,
            code=code,
            error_type=error_type,
            details=details,
            timestamp=timestamp,
            request_id=request_id,
            rate_limit=rate_limit
        ) from exc


@dataclass
class Status: ...


@dataclass
class Queued(Status):
    """Indicates the request is enqueued and waiting to be processed. The position
    field indicates the relative position in the queue (0-indexed)."""

    position: int


@dataclass
class InProgress(Status):
    """Indicates the request is currently being processed. If the status operation called
    log objects."""

    logs: str | None = field(default=None)


@dataclass
class Completed(Status):
    """Indicates the request has been completed and the result can be gathered. Metrics
    might contain the inference time, and other internal metadata (number of tokens
    processed, etc.)."""

    logs: str | None = field(default=None)
    metrics: dict[str, Any] = field(default_factory=dict)
    success: bool = field(default=True)
    error: dict[str, Any] | None = field(default=None)


@dataclass(frozen=True)
class _BaseRequestHandle:
    request_id: str
    response_url: str = field(repr=False)
    status_url: str = field(repr=False)
    cancel_url: str = field(repr=False)

    def _parse_status(self, data: AnyJSON) -> Status:
        if data.get("status") == "IN_QUEUE":
            return Queued(position=data.get("queue_position", 0))
        elif data.get("status") == "IN_PROGRESS":
            return InProgress(logs=data.get("logs", ""))
        elif data.get("status") == "COMPLETED":
            metrics = data.get("metrics", {})
            success = data.get("success", True)
            error = data.get("error")
            return Completed(logs=data.get("logs", ""), metrics=metrics, success=success, error=error)
        else:
            raise ValueError(f"Unknown status: {data.get('status')}")


APP_NAMESPACES = ["workflows", "comfy"]


def _request(client: httpx.Client, method: str, url: str, **kwargs: Any) -> httpx.Response:
    response = client.request(method, url, **kwargs)
    _raise_for_status(response)
    return response


async def _async_request(client: httpx.AsyncClient, method: str, url: str, **kwargs: Any) -> httpx.Response:
    response = await client.request(method, url, **kwargs)
    _raise_for_status(response)
    return response


def _should_retry(status_code: int) -> bool:
    if status_code in [408, 409, 429] or status_code >= 500:
        return True
    return False


MAX_RETRIES = 3


def _maybe_retry_request(client: httpx.Client, method: str, url: str, **kwargs: Any) -> httpx.Response:
    retries = MAX_RETRIES
    while retries > 0:
        try:
            return _request(client, method, url, **kwargs)
        except httpx.HTTPStatusError as exc:
            if _should_retry(exc.response.status_code):
                logger.debug(f"Retrying request to {url} due to {exc} ({retries} retries left)")
                retries -= 1
                continue
            raise


async def _async_maybe_retry_request(client: httpx.AsyncClient, method: str, url: str, **kwargs: Any) -> httpx.Response:
    retries = MAX_RETRIES
    while retries > 0:
        try:
            return await _async_request(client, method, url, **kwargs)
        except httpx.HTTPStatusError as exc:
            if _should_retry(exc.response.status_code):
                logger.debug(f"Retrying request to {url} due to {exc} ({retries} retries left)")
                retries -= 1
                continue
            raise


@dataclass(frozen=True)
class SyncRequestHandle(_BaseRequestHandle):
    client: httpx.Client = field(repr=False)

    @classmethod
    def from_request_id(cls, client: httpx.Client, request_id: str) -> SyncRequestHandle:
        base_url = f"{QUEUE_URL_FORMAT}/requests/{request_id}"
        return cls(
            request_id=request_id,
            response_url=base_url,
            status_url=base_url + "/status",
            cancel_url=base_url + "/cancel",
            client=client,
        )

    def status(self) -> Status:
        """Returns the status of the request (which can be one of the following:
        Queued, InProgress, Completed)."""

        response = _maybe_retry_request(
            self.client,
            "GET",
            self.status_url,
        )
        _raise_for_status(response)

        return self._parse_status(response.json())

    def iter_events(self, *, interval: float = 0.1) -> Iterator[Status]:
        """Continuously poll for the status of the request and yield it at each interval till
        the request is completed."""

        while True:
            status = self.status()
            yield status
            if isinstance(status, Completed):
                break
            time.sleep(interval)

    def get(self) -> AnyJSON:
        """Wait till the request is completed and return the result of the inference call."""
        final_status = None
        for status in self.iter_events():
            if isinstance(status, Completed):
                final_status = status
                break

        if final_status and not final_status.success:
            error_message = "Request failed"
            code = None
            details = None
            timestamp = None

            if final_status.error:
                error_message = final_status.error.get("message", error_message)
                code = final_status.error.get("code")
                details = final_status.error.get("details")
                timestamp = final_status.error.get("timestamp")

            raise SunraClientError(
                message=error_message,
                code=code,
                details=details,
                timestamp=timestamp
            )

        response = _maybe_retry_request(self.client, "GET", self.response_url)
        _raise_for_status(response)
        return response.json()

    def cancel(self) -> None:
        """Cancel the request."""
        response = _maybe_retry_request(self.client, "PUT", self.cancel_url)
        _raise_for_status(response)


@dataclass(frozen=True)
class AsyncRequestHandle(_BaseRequestHandle):
    client: httpx.AsyncClient = field(repr=False)

    @classmethod
    def from_request_id(cls, client: httpx.AsyncClient, request_id: str) -> AsyncRequestHandle:
        base_url = f"{QUEUE_URL_FORMAT}/requests/{request_id}"
        return cls(
            request_id=request_id,
            response_url=base_url,
            status_url=base_url + "/status",
            cancel_url=base_url + "/cancel",
            client=client,
        )

    async def status(self) -> Status:
        """Returns the status of the request (which can be one of the following:
        Queued, InProgress, Completed)."""

        response = await _async_maybe_retry_request(
            self.client,
            "GET",
            self.status_url,
        )
        _raise_for_status(response)

        return self._parse_status(response.json())

    async def iter_events(self, *, interval: float = 0.1) -> AsyncIterator[Status]:
        """Continuously poll for the status of the request and yield it at each interval till
        the request is completed."""

        while True:
            status = await self.status()
            yield status
            if isinstance(status, Completed):
                break
            await asyncio.sleep(interval)

    async def get(self) -> AnyJSON:
        """Wait till the request is completed and return the result."""
        final_status = None
        async for status in self.iter_events():
            if isinstance(status, Completed):
                final_status = status
                break

        if final_status and not final_status.success:
            error_message = "Request failed"
            code = None
            details = None
            timestamp = None

            if final_status.error:
                error_message = final_status.error.get("message", error_message)
                code = final_status.error.get("code")
                details = final_status.error.get("details")
                timestamp = final_status.error.get("timestamp")

            raise SunraClientError(
                message=error_message,
                code=code,
                details=details,
                timestamp=timestamp
            )

        response = await _async_maybe_retry_request(self.client, "GET", self.response_url)
        _raise_for_status(response)
        return response.json()

    async def cancel(self) -> None:
        """Cancel the request."""
        response = await _async_maybe_retry_request(self.client, "PUT", self.cancel_url)
        _raise_for_status(response)


@dataclass(frozen=True)
class AsyncClient:
    key: str | None = field(default=None, repr=False)
    default_timeout: float = 120.0

    def _get_key(self) -> str:
        if self.key is None:
            return fetch_credentials()
        return self.key

    @cached_property
    def _client(self) -> httpx.AsyncClient:
        key = self._get_key()
        return httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {key}",
                "User-Agent": USER_AGENT,
            },
            timeout=self.default_timeout,
        )

    async def transform_input(self, input_data: Any) -> Any:
        """Transform input data by uploading files, images, and base64 data URIs.

        This method recursively processes the input and:
        - Uploads PIL Image objects and returns their URLs
        - Decodes and uploads base64 data URIs and returns their URLs
        - Uploads file paths and returns their URLs
        - Uploads file-like objects (with read method) and returns their URLs
        - Recursively processes dictionaries and lists
        - Returns other values unchanged

        Args:
            input_data: The input data to transform

        Returns:
            The transformed input with uploaded URLs replacing file objects
        """
        # Handle lists recursively
        if isinstance(input_data, list):
            return [await self.transform_input(item) for item in input_data]

        # Handle dictionaries recursively
        elif isinstance(input_data, dict):
            result = {}
            for key, value in input_data.items():
                result[key] = await self.transform_input(value)
            return result

        # Handle PIL Image objects
        elif hasattr(input_data, 'save') and hasattr(input_data, 'mode') and hasattr(input_data, 'format'):
            # This is likely a PIL Image - check if it has the expected PIL Image interface
            try:
                # Try to check if it's actually a PIL Image
                if hasattr(input_data, '__class__') and 'PIL' in str(type(input_data)):
                    return await self.upload_image(input_data)
                # Fallback: if it has save/mode/format, assume it's PIL-like
                elif all(hasattr(input_data, attr) for attr in ['save', 'mode', 'format']):
                    return await self.upload_image(input_data)
            except Exception as e:
                logger.warning(f"Failed to upload image: {e}")
                raise

        # Handle base64 data URIs
        elif isinstance(input_data, str) and DATA_URI_PATTERN.match(input_data):
            try:
                # Extract content type and data
                header, encoded_data = input_data.split(',', 1)
                content_type = header.split(';')[0].split(':')[1]

                # Decode base64 data
                data = base64.b64decode(encoded_data)

                # Upload the data
                return await self.upload(data, content_type)
            except Exception as e:
                logger.warning(f"Failed to upload base64 data URI: {e}")
                raise

        # Handle file paths (strings that represent valid file paths)
        elif isinstance(input_data, (str, os.PathLike)) and os.path.isfile(input_data):
            try:
                return await self.upload_file(input_data)
            except Exception as e:
                logger.warning(f"Failed to upload file: {e}")
                raise

        # Handle file-like objects (objects with read method)
        elif hasattr(input_data, 'read'):
            try:
                data = input_data.read()
                if hasattr(input_data, 'seek'):
                    input_data.seek(0)  # Reset file pointer

                # Try to determine content type
                content_type = getattr(input_data, 'content_type', None)
                if not content_type:
                    # Try to get name and guess from extension
                    name = getattr(input_data, 'name', 'upload.bin')
                    content_type, _ = mimetypes.guess_type(name)
                    if not content_type:
                        content_type = 'application/octet-stream'

                file_name = getattr(input_data, 'name', None)
                if file_name:
                    file_name = os.path.basename(file_name)

                return await self.upload(data, content_type, file_name)
            except Exception as e:
                logger.warning(f"Failed to upload file-like object: {e}")
                raise

        # Return unchanged for other types
        return input_data

    async def submit(
        self,
        application: str,
        arguments: AnyJSON,
        *,
        path: str = "",
        webhook_url: str | None = None,
        with_logs: bool = True,
    ) -> AsyncRequestHandle:
        """Submit an application with the given arguments (which will be JSON serialized).

        The path parameter can be used to specify a subpath when applicable. This method will return a handle to the
        request that can be used to check the status and retrieve the result of the inference call when it is done.
        """

        # Transform input to upload files automatically
        transformed_arguments = await self.transform_input(arguments)

        url = QUEUE_URL_FORMAT + application
        if path:
            url += "/" + path.lstrip("/")

        if with_logs:
            url += "?logs=1"
        else:
            url += "?logs=0"

        if webhook_url is not None:
            url += "&" + urlencode({"webhook": webhook_url})

        response = await _async_maybe_retry_request(
            self._client,
            "POST",
            url,
            json=transformed_arguments,
            timeout=self.default_timeout,
        )
        _raise_for_status(response)

        data = response.json()
        return AsyncRequestHandle(
            request_id=data.get("request_id", ""),
            response_url=data.get("response_url", ""),
            status_url=data.get("status_url", ""),
            cancel_url=data.get("cancel_url", ""),
            client=self._client,
        )

    async def subscribe(
        self,
        application: str,
        arguments: AnyJSON,
        *,
        path: str = "",
        on_enqueue: Callable[[Queued], None] | None = None,
        with_logs: bool = True,
        on_queue_update: Callable[[Status], None] | None = None,
        on_error: Callable[[SunraClientError], None] | None = None,
    ) -> AnyJSON | None:
        try:
            handle = await self.submit(
                application,
                arguments,
                path=path,
                with_logs=with_logs,
            )

            if on_enqueue is not None:
                on_enqueue(handle.request_id)

            if on_queue_update is not None:
                async for event in handle.iter_events():
                    on_queue_update(event)

            return await handle.get()
        except SunraClientError as e:
            if on_error is not None:
                on_error(e)
                return None  # Don't raise if onError is provided
            raise

    def get_handle(self, request_id: str) -> AsyncRequestHandle:
        return AsyncRequestHandle.from_request_id(self._client, request_id)

    async def status(
        self,
        request_id: str,
    ) -> Status:
        handle = self.get_handle(request_id)
        return await handle.status()

    async def result(self, request_id: str) -> AnyJSON:
        handle = self.get_handle(request_id)
        return await handle.get()

    async def cancel(self, request_id: str) -> None:
        handle = self.get_handle(request_id)
        await handle.cancel()

    async def stream(
        self,
        application: str,
        arguments: AnyJSON,
        *,
        path: str = "",
        timeout: float | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        handle = await self.submit(
            application,
            arguments,
            path=path,
        )
        url = f"https://api.{SUNRA_HOST}/v1/queue/requests/{handle.request_id}/status/stream"
        async with aconnect_sse(
            self._client,
            "GET",
            url,
            timeout=timeout,
        ) as events:
            async for event in events.aiter_sse():
                data = event.json()
                yield data
                if data.get("status") in ("COMPLETED", "FAILED", "CANCELLED"):
                    break

    async def upload(self, data: str | bytes, content_type: str, file_name: str | None = None) -> str:
        if isinstance(data, str):
            data = data.encode("utf-8")

        if file_name is None:
            file_name = "upload.bin"

        # Get upload URLs
        init_response = await self._client.post(
            f"https://api.{SUNRA_HOST}/v1/storage/upload/initiate",
            json={"content_type": content_type, "file_name": file_name},
        )
        _raise_for_status(init_response)
        upload_data = init_response.json()
        upload_url = upload_data.get("upload_url", "")
        file_url = upload_data.get("file_url", "")

        # Upload data using signed URL
        def do_upload():
            response = requests.put(
                upload_url,
                data=data,
                headers={
                    "Content-Type": content_type,
                },
            )
            response.raise_for_status()
            return response

        await anyio.to_thread.run_sync(do_upload)

        return file_url

    async def upload_image(self, image: Image.Image, image_format: str = "png") -> str:
        """Upload a pillow image object"""

        with io.BytesIO() as buffer:
            image.save(buffer, format=image_format)
            return await self.upload(buffer.getvalue(), f"image/{image_format}")

    async def upload_file(self, path: os.PathLike) -> str:
        """Upload a file from the local filesystem to the CDN and return the access URL."""
        mime_type, _ = mimetypes.guess_type(path)
        if mime_type is None:
            mime_type = "application/octet-stream"

        with open(path, "rb") as file:
            file_name = os.path.basename(path)
            return await self.upload(file.read(), mime_type, file_name)


@dataclass(frozen=True)
class SyncClient:
    key: str | None = field(default=None, repr=False)
    default_timeout: float = 120.0

    def _get_key(self) -> str:
        if self.key is None:
            return fetch_credentials()
        return self.key

    @cached_property
    def _client(self) -> httpx.Client:
        key = self._get_key()
        return httpx.Client(
            headers={
                "Authorization": f"Bearer {key}",
                "User-Agent": USER_AGENT,
            },
            timeout=self.default_timeout,
            follow_redirects=True,
        )

    def transform_input(self, input_data: Any) -> Any:
        """Transform input data by uploading files, images, and base64 data URIs.

        This method recursively processes the input and:
        - Uploads PIL Image objects and returns their URLs
        - Decodes and uploads base64 data URIs and returns their URLs
        - Uploads file paths and returns their URLs
        - Uploads file-like objects (with read method) and returns their URLs
        - Recursively processes dictionaries and lists
        - Returns other values unchanged

        Args:
            input_data: The input data to transform

        Returns:
            The transformed input with uploaded URLs replacing file objects
        """
        # Handle lists recursively
        if isinstance(input_data, list):
            return [self.transform_input(item) for item in input_data]

        # Handle dictionaries recursively
        elif isinstance(input_data, dict):
            result = {}
            for key, value in input_data.items():
                result[key] = self.transform_input(value)
            return result

        # Handle PIL Image objects
        elif hasattr(input_data, 'save') and hasattr(input_data, 'mode') and hasattr(input_data, 'format'):
            # This is likely a PIL Image - check if it has the expected PIL Image interface
            try:
                # Try to check if it's actually a PIL Image
                if hasattr(input_data, '__class__') and 'PIL' in str(type(input_data)):
                    return self.upload_image(input_data)
                # Fallback: if it has save/mode/format, assume it's PIL-like
                elif all(hasattr(input_data, attr) for attr in ['save', 'mode', 'format']):
                    return self.upload_image(input_data)
            except Exception as e:
                logger.warning(f"Failed to upload image: {e}")
                raise

        # Handle base64 data URIs
        elif isinstance(input_data, str) and DATA_URI_PATTERN.match(input_data):
            try:
                # Extract content type and data
                header, encoded_data = input_data.split(',', 1)
                content_type = header.split(';')[0].split(':')[1]

                # Decode base64 data
                data = base64.b64decode(encoded_data)

                # Upload the data
                return self.upload(data, content_type)
            except Exception as e:
                logger.warning(f"Failed to upload base64 data URI: {e}")
                raise

        # Handle file paths (strings that represent valid file paths)
        elif isinstance(input_data, (str, os.PathLike)) and os.path.isfile(input_data):
            try:
                return self.upload_file(input_data)
            except Exception as e:
                logger.warning(f"Failed to upload file: {e}")
                raise

        # Handle file-like objects (objects with read method)
        elif hasattr(input_data, 'read'):
            try:
                data = input_data.read()
                if hasattr(input_data, 'seek'):
                    input_data.seek(0)  # Reset file pointer

                # Try to determine content type
                content_type = getattr(input_data, 'content_type', None)
                if not content_type:
                    # Try to get name and guess from extension
                    name = getattr(input_data, 'name', 'upload.bin')
                    content_type, _ = mimetypes.guess_type(name)
                    if not content_type:
                        content_type = 'application/octet-stream'

                file_name = getattr(input_data, 'name', None)
                if file_name:
                    file_name = os.path.basename(file_name)

                return self.upload(data, content_type, file_name)
            except Exception as e:
                logger.warning(f"Failed to upload file-like object: {e}")
                raise

        # Return unchanged for other types
        return input_data

    def submit(
        self,
        application: str,
        arguments: AnyJSON,
        *,
        path: str = "",
        webhook_url: str | None = None,
        with_logs: bool = True,
    ) -> SyncRequestHandle:
        """Submit an application with the given arguments (which will be JSON serialized).

        The path parameter can be used to specify a subpath when applicable. This method will return a handle to the
        request that can be used to check the status and retrieve the result of the inference call when it is done.
        """

        # Transform input to upload files automatically
        transformed_arguments = self.transform_input(arguments)

        url = QUEUE_URL_FORMAT + application
        if path:
            url += "/" + path.lstrip("/")

        if with_logs:
            url += "?logs=1"
        else:
            url += "?logs=0"

        if webhook_url is not None:
            url += "&" + urlencode({"webhook": webhook_url})

        response = _maybe_retry_request(
            self._client,
            "POST",
            url,
            json=transformed_arguments,
            timeout=self.default_timeout,
        )
        _raise_for_status(response)

        data = response.json()
        return SyncRequestHandle(
            request_id=data.get("request_id", ""),
            response_url=data.get("response_url", ""),
            status_url=data.get("status_url", ""),
            cancel_url=data.get("cancel_url", ""),
            client=self._client,
        )

    def subscribe(
        self,
        application: str,
        arguments: AnyJSON,
        *,
        path: str = "",
        on_enqueue: Callable[[Queued], None] | None = None,
        with_logs: bool = True,
        on_queue_update: Callable[[Status], None] | None = None,
        on_error: Callable[[SunraClientError], None] | None = None,
    ) -> AnyJSON | None:
        try:
            handle = self.submit(
                application,
                arguments,
                path=path,
                with_logs=with_logs,
            )

            if on_enqueue is not None:
                on_enqueue(handle.request_id)

            if on_queue_update is not None:
                for event in handle.iter_events():
                    on_queue_update(event)

            return handle.get()
        except SunraClientError as e:
            if on_error is not None:
                on_error(e)
                return None  # Don't raise if onError is provided
            raise

    def get_handle(self, request_id: str) -> SyncRequestHandle:
        return SyncRequestHandle.from_request_id(self._client, request_id)

    def status(
        self,
        request_id: str,
    ) -> Status:
        handle = self.get_handle(request_id)
        return handle.status()

    def result(self, request_id: str) -> AnyJSON:
        handle = self.get_handle(request_id)
        return handle.get()

    def cancel(self, request_id: str) -> None:
        handle = self.get_handle(request_id)
        handle.cancel()

    def stream(
        self,
        application: str,
        arguments: AnyJSON,
        *,
        path: str = "",
        timeout: float | None = None,
    ) -> Iterator[dict[str, Any]]:
        """Stream the status updates of a request by request_id. Each yielded item is a status event from the server."""
        handle = self.submit(
            application,
            arguments,
            path=path,
        )
        url = f"https://api.{SUNRA_HOST}/v1/queue/requests/{handle.request_id}/status/stream"
        with connect_sse(
            self._client,
            "GET",
            url,
            timeout=timeout,
        ) as events:
            for event in events.iter_sse():
                data = event.json()
                yield data
                if data.get("status") in ("COMPLETED", "FAILED", "CANCELLED"):
                    break

    def upload(self, data: str | bytes, content_type: str, file_name: str | None = None) -> str:
        if isinstance(data, str):
            data = data.encode("utf-8")

        if file_name is None:
            file_name = "upload.bin"

        # Get upload URLs
        init_response = self._client.post(
            f"https://api.{SUNRA_HOST}/v1/storage/upload/initiate",
            json={"content_type": content_type, "file_name": file_name},
        )
        _raise_for_status(init_response)
        upload_data = init_response.json()
        upload_url = upload_data.get("upload_url", "")
        file_url = upload_data.get("file_url", "")

        # Upload data using signed URL
        response = requests.put(
            upload_url,
            data=data,
            headers={
                "Content-Type": content_type,
            },
        )
        response.raise_for_status()

        return file_url

    def upload_image(self, image: Image.Image, image_format: str = "png") -> str:
        """Upload a pillow image object to the CDN and return the access URL."""

        with io.BytesIO() as buffer:
            image.save(buffer, format=image_format)
            return self.upload(buffer.getvalue(), f"image/{image_format}")

    def upload_file(self, path: os.PathLike) -> str:
        """Upload a file from the local filesystem to the CDN and return the access URL."""
        mime_type, _ = mimetypes.guess_type(path)
        if mime_type is None:
            mime_type = "application/octet-stream"

        with open(path, "rb") as file:
            file_name = os.path.basename(path)
            return self.upload(file.read(), mime_type, file_name)


def encode(data: str | bytes, content_type: str) -> str:
    """Encode the given data blob to a data URL with the specified content type."""
    if isinstance(data, str):
        data = data.encode("utf-8")

    return f"data:{content_type};base64,{base64.b64encode(data).decode()}"


def encode_file(path: os.PathLike) -> str:
    """Encode a file from the local filesystem to a data URL with the inferred content type."""
    mime_type, _ = mimetypes.guess_type(path)
    if mime_type is None:
        mime_type = "application/octet-stream"

    with open(path, "rb") as file:
        return encode(file.read(), mime_type)


def encode_image(image: Image.Image, image_format: str = "png") -> str:
    """Encode a pillow image object to a data URL with the specified format."""
    with io.BytesIO() as buffer:
        image.save(buffer, format=image_format)
        return encode(buffer.getvalue(), f"image/{image_format}")

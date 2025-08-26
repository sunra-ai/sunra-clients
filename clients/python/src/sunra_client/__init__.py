from sunra_client.auth import config, fetch_http_client, fetch_async_http_client
from sunra_client.client import (
    AsyncClient,
    AsyncRequestHandle,
    Completed,
    InProgress,
    Queued,
    Status,
    SyncClient,
    SyncRequestHandle,
    encode,
    encode_file,
    encode_image,
    SunraClientError,
)

__all__ = [
    "config",
    "SyncClient",
    "AsyncClient",
    "Status",
    "Queued",
    "InProgress",
    "Completed",
    "SyncRequestHandle",
    "AsyncRequestHandle",
    "subscribe_async",
    "subscribe",
    "submit",
    "stream",
    "submit_async",
    "stream_async",
    "cancel",
    "cancel_async",
    "status",
    "status_async",
    "result",
    "result_async",
    "encode",
    "encode_file",
    "encode_image",
    "SunraClientError",
]

def _get_sync_client() -> SyncClient:
    """Get a sync client with global configuration."""
    return SyncClient(http_client=fetch_http_client())

def _get_async_client() -> AsyncClient:
    """Get an async client with global configuration."""
    return AsyncClient(http_client=fetch_async_http_client())

# Create function wrappers that use the configured clients
def subscribe(*args, **kwargs):
    return _get_sync_client().subscribe(*args, **kwargs)

def submit(*args, **kwargs):
    return _get_sync_client().submit(*args, **kwargs)

def status(*args, **kwargs):
    return _get_sync_client().status(*args, **kwargs)

def result(*args, **kwargs):
    return _get_sync_client().result(*args, **kwargs)

def cancel(*args, **kwargs):
    return _get_sync_client().cancel(*args, **kwargs)

def stream(*args, **kwargs):
    return _get_sync_client().stream(*args, **kwargs)

def upload(*args, **kwargs):
    return _get_sync_client().upload(*args, **kwargs)

def upload_image(*args, **kwargs):
    return _get_sync_client().upload_image(*args, **kwargs)

async def subscribe_async(*args, **kwargs):
    return await _get_async_client().subscribe(*args, **kwargs)

async def submit_async(*args, **kwargs):
    return await _get_async_client().submit(*args, **kwargs)

async def status_async(*args, **kwargs):
    return await _get_async_client().status(*args, **kwargs)

async def result_async(*args, **kwargs):
    return await _get_async_client().result(*args, **kwargs)

async def cancel_async(*args, **kwargs):
    return await _get_async_client().cancel(*args, **kwargs)

async def stream_async(*args, **kwargs):
    async for item in _get_async_client().stream(*args, **kwargs):
        yield item

async def upload_async(*args, **kwargs):
    return await _get_async_client().upload(*args, **kwargs)

async def upload_image_async(*args, **kwargs):
    return await _get_async_client().upload_image(*args, **kwargs)

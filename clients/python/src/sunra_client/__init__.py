from sunra_client.auth import config
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

sync_client = SyncClient()
subscribe = sync_client.subscribe
submit = sync_client.submit
status = sync_client.status
result = sync_client.result
cancel = sync_client.cancel
stream = sync_client.stream
upload = sync_client.upload
upload_image = sync_client.upload_image

async_client = AsyncClient()
subscribe_async = async_client.subscribe
submit_async = async_client.submit
status_async = async_client.status
result_async = async_client.result
cancel_async = async_client.cancel
stream_async = async_client.stream
upload_async = async_client.upload
upload_image_async = async_client.upload_image

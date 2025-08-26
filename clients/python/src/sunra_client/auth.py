"""Authentication utilities for the Sunra client."""

import os
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    import httpx


class MissingCredentialsError(Exception):
    """Raised when the Sunra API key is not found in environment variables."""


SUNRA_HOST = os.environ.get("SUNRA_HOST", "sunra.ai")


class _GlobalConfig:
    """Global configuration for the Sunra client."""

    def __init__(self):
        self._credentials: Optional[str] = None
        self._http_client: Optional["httpx.Client"] = None
        self._async_http_client: Optional["httpx.AsyncClient"] = None

    def set_credentials(self, credentials: str) -> None:
        """Set the global credentials."""
        self._credentials = credentials

    def get_credentials(self) -> Optional[str]:
        """Get the global credentials."""
        return self._credentials

    def set_http_client(self, http_client: Optional["httpx.Client"]) -> None:
        """Set the global sync HTTP client."""
        self._http_client = http_client

    def get_http_client(self) -> Optional["httpx.Client"]:
        """Get the global sync HTTP client."""
        return self._http_client

    def set_async_http_client(self, async_http_client: Optional["httpx.AsyncClient"]) -> None:
        """Set the global async HTTP client."""
        self._async_http_client = async_http_client

    def get_async_http_client(self) -> Optional["httpx.AsyncClient"]:
        """Get the global async HTTP client."""
        return self._async_http_client


# Global configuration instance
_global_config = _GlobalConfig()


def config(
    *,
    credentials: Optional[str] = None,
    http_client: Optional["httpx.Client"] = None,
    async_http_client: Optional["httpx.AsyncClient"] = None
) -> None:
    """Configure the Sunra client with global settings.

    Args:
        credentials: The API key to use for authentication.
        http_client: Custom httpx.Client instance for sync operations.
        async_http_client: Custom httpx.AsyncClient instance for async operations.

    Examples:
        Configure credentials only:
        >>> import sunra_client
        >>> sunra_client.config(credentials="your-api-key")

        Configure with custom HTTP client:
        >>> import httpx
        >>> import sunra_client
        >>> proxy_client = httpx.Client(proxy="http://proxy:8080")
        >>> sunra_client.config(
        ...     credentials="your-api-key",
        ...     http_client=proxy_client
        ... )

        Configure with both sync and async clients:
        >>> import httpx
        >>> import sunra_client
        >>> sync_client = httpx.Client(proxy="http://proxy:8080")
        >>> async_client = httpx.AsyncClient(proxy="http://proxy:8080")
        >>> sunra_client.config(
        ...     credentials="your-api-key",
        ...     http_client=sync_client,
        ...     async_http_client=async_client
        ... )
    """
    if credentials is not None:
        _global_config.set_credentials(credentials)
    if http_client is not None:
        _global_config.set_http_client(http_client)
    if async_http_client is not None:
        _global_config.set_async_http_client(async_http_client)


def fetch_credentials() -> str:
    """Fetch the Sunra API key from global config or environment variables."""
    # First try global config
    if credentials := _global_config.get_credentials():
        return credentials

    # Fallback to environment variable
    if key := os.getenv("SUNRA_KEY"):
        return key
    else:
        raise MissingCredentialsError("Please set the SUNRA_KEY environment variable to your API key, or use sunra_client.config(credentials='your-api-key').")


def fetch_http_client() -> Optional["httpx.Client"]:
    """Fetch the configured sync HTTP client from global config."""
    return _global_config.get_http_client()


def fetch_async_http_client() -> Optional["httpx.AsyncClient"]:
    """Fetch the configured async HTTP client from global config."""
    return _global_config.get_async_http_client()

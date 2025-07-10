"""Authentication utilities for the Sunra client."""

import os
from typing import Optional


class MissingCredentialsError(Exception):
    """Raised when the Sunra API key is not found in environment variables."""


SUNRA_HOST = os.environ.get("SUNRA_HOST", "sunra.ai")


class _GlobalConfig:
    """Global configuration for the Sunra client."""

    def __init__(self):
        self._credentials: Optional[str] = None

    def set_credentials(self, credentials: str) -> None:
        """Set the global credentials."""
        self._credentials = credentials

    def get_credentials(self) -> Optional[str]:
        """Get the global credentials."""
        return self._credentials


# Global configuration instance
_global_config = _GlobalConfig()


def config(*, credentials: str) -> None:
    """Configure the Sunra client with global settings.

    Args:
        credentials: The API key to use for authentication.

    Example:
        >>> import sunra_client
        >>> sunra_client.config(credentials="your-api-key")
    """
    _global_config.set_credentials(credentials)


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

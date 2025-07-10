"""Authentication utilities for the Sunra client."""

import os


class MissingCredentialsError(Exception):
    """Raised when the Sunra API key is not found in environment variables."""


SUNRA_HOST = os.environ.get("SUNRA_HOST", "sunra.ai")


def fetch_credentials() -> str:
    """Fetch the Sunra API key from environment variables."""
    if key := os.getenv("SUNRA_KEY"):
        return key
    else:
        raise MissingCredentialsError("Please set the SUNRA_KEY environment variable to your API key.")

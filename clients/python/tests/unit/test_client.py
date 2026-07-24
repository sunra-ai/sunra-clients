import os
import pytest
from unittest.mock import AsyncMock, Mock, patch

import sunra_client
from sunra_client.auth import _global_config, MissingCredentialsError


def test_config_sets_global_credentials():
    """Test that config() sets global credentials correctly."""
    # Clear any existing global credentials
    _global_config._credentials = None

    # Set credentials using config function
    test_key = "test-api-key-123"
    sunra_client.config(credentials=test_key)

    # Verify credentials are set
    assert _global_config.get_credentials() == test_key

    # Clean up
    _global_config._credentials = None


def test_fetch_credentials_uses_global_config():
    """Test that fetch_credentials uses global config when available."""
    # Clear any existing global credentials
    _global_config._credentials = None

    # Mock environment variable to not be set
    with patch.dict(os.environ, {}, clear=True):
        # Should raise error when no credentials are available
        with pytest.raises(MissingCredentialsError):
            sunra_client.auth.fetch_credentials()

        # Set global credentials
        test_key = "global-test-key"
        sunra_client.config(credentials=test_key)

        # Now fetch_credentials should return global credentials
        assert sunra_client.auth.fetch_credentials() == test_key

    # Clean up
    _global_config._credentials = None


def test_fetch_credentials_priority():
    """Test that global config takes priority over environment variables."""
    # Clear any existing global credentials
    _global_config._credentials = None

    env_key = "env-test-key"
    global_key = "global-test-key"

    # Set environment variable
    with patch.dict(os.environ, {"SUNRA_KEY": env_key}):
        # Without global config, should use environment variable
        assert sunra_client.auth.fetch_credentials() == env_key

        # Set global config
        sunra_client.config(credentials=global_key)

        # Should now use global config (takes priority)
        assert sunra_client.auth.fetch_credentials() == global_key

    # Clean up
    _global_config._credentials = None


def test_client_uses_global_config():
    """Test that clients use global config when no key is explicitly provided."""
    # Clear any existing global credentials
    _global_config._credentials = None

    test_key = "client-test-key"

    # Set global credentials
    sunra_client.config(credentials=test_key)

    # Create client without explicit key
    client = sunra_client.SyncClient()

    # Should use global credentials
    assert client._get_key() == test_key

    # Clean up
    _global_config._credentials = None


def test_client_explicit_key_overrides_global():
    """Test that explicit client key overrides global config."""
    # Clear any existing global credentials
    _global_config._credentials = None

    global_key = "global-key"
    explicit_key = "explicit-key"

    # Set global credentials
    sunra_client.config(credentials=global_key)

    # Create client with explicit key
    client = sunra_client.SyncClient(key=explicit_key)

    # Should use explicit key
    assert client._get_key() == explicit_key

    # Clean up
    _global_config._credentials = None


def test_sync_submit_writes_provider_into_canonical_request_body():
    client = sunra_client.SyncClient(key="test-key")
    response = Mock()
    response.json.return_value = {
        "request_id": "req_test",
        "response_url": "/requests/req_test",
        "status_url": "/requests/req_test/status",
        "cancel_url": "/requests/req_test/cancel",
    }

    with (
        patch("sunra_client.client._maybe_retry_request", return_value=response) as request,
        patch("sunra_client.client._raise_for_status"),
    ):
        client.submit(
            "google/gemini-2.5-flash-image/text-to-image",
            {"prompt": "sunrise"},
            provider={"only": ["fal"]},
        )

    assert request.call_args.kwargs["json"] == {
        "prompt": "sunrise",
        "provider": {"only": ["fal"]},
    }


async def test_async_submit_writes_provider_into_canonical_request_body():
    client = sunra_client.AsyncClient(key="test-key")
    response = Mock()
    response.json.return_value = {
        "request_id": "req_test",
        "response_url": "/requests/req_test",
        "status_url": "/requests/req_test/status",
        "cancel_url": "/requests/req_test/cancel",
    }

    with (
        patch(
            "sunra_client.client._async_maybe_retry_request",
            new=AsyncMock(return_value=response),
        ) as request,
        patch("sunra_client.client._raise_for_status"),
    ):
        await client.submit(
            "google/gemini-2.5-flash-image/text-to-image",
            {"prompt": "sunrise"},
            provider={"only": ["fal"]},
        )

    assert request.call_args.kwargs["json"] == {
        "prompt": "sunrise",
        "provider": {"only": ["fal"]},
    }

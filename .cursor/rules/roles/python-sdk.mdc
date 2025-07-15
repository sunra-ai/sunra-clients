---
description: This document defines the role and responsibilities of a Python SDK Developer for the Sunra Clients project. The Python SDK provides both synchronous and asynchronous client libraries for interacting with Sunra.ai services, following Python best practices and type safety standards.
globs:
alwaysApply: false
---
# Sunra Clients - Python SDK Developer Role Document

## Overview
This document defines the role and responsibilities of a Python SDK Developer for the Sunra Clients project. The Python SDK provides both synchronous and asynchronous client libraries for interacting with Sunra.ai services, following Python best practices and type safety standards.

## Project Structure
The Python SDK is organized as follows:
- **src/sunra_client/**: Main package directory
  - **__init__.py**: Package initialization and public API
  - **client.py**: Main client implementation with sync/async support
  - **auth.py**: Authentication and credential management
  - **py.typed**: Type checking marker file

## Development Guidelines

### 1. Code Style and Standards

#### Python Style Guide
- Follow **PEP 8** coding standards
- Use **4 spaces** for indentation (Python standard)
- Maximum line length: **120 characters**
- Use **snake_case** for functions and variables: `submit_request`, `get_status`
- Use **PascalCase** for class names: `SunraClient`, `QueueClient`
- Use **UPPER_SNAKE_CASE** for constants: `DEFAULT_TIMEOUT`, `MAX_RETRIES`

#### Type Hints
- Use **type hints** for all function parameters and return values
- Use modern union syntax: `str | None` instead of `Optional[str]`
- Include `from __future__ import annotations` for forward references
- Maintain **py.typed** file for type checking support

#### Import Organization
```python
# Standard library imports
import asyncio
import os
from typing import Any, Dict, Optional, Union

# Third-party imports
import httpx
from pydantic import BaseModel, Field

# Local imports
from .auth import CredentialsResolver
from .exceptions import SunraException, SunraValidationException
```

### 2. Architecture Patterns

#### Client Architecture
```python
class SunraClient:
    """Main Sunra client with both sync and async support."""

    def __init__(
        self,
        credentials: str | None = None,
        api_endpoint: str | None = None,
        queue_domain: str | None = None,
        timeout: float = 300.0,
    ):
        self._credentials = credentials or os.getenv("SUNRA_KEY")
        self._api_endpoint = api_endpoint or os.getenv("SUNRA_API_ENDPOINT")
        self._queue_domain = queue_domain or os.getenv("SUNRA_QUEUE_DOMAIN")
        self._timeout = timeout

        # Initialize HTTP clients
        self._sync_client = httpx.Client(timeout=timeout)
        self._async_client = httpx.AsyncClient(timeout=timeout)

    def subscribe(self, endpoint_id: str, **kwargs) -> Dict[str, Any]:
        """Synchronous subscribe method."""
        pass

    async def subscribe_async(self, endpoint_id: str, **kwargs) -> Dict[str, Any]:
        """Asynchronous subscribe method."""
        pass
```

#### Dual API Pattern
```python
# Sync API
def subscribe(
    endpoint_id: str,
    arguments: Dict[str, Any],
    with_logs: bool = False,
    on_enqueue: Callable[[str], None] | None = None,
    on_queue_update: Callable[[Dict[str, Any]], None] | None = None,
) -> Dict[str, Any]:
    """Synchronous subscribe implementation."""
    pass

# Async API
async def subscribe_async(
    endpoint_id: str,
    arguments: Dict[str, Any],
    with_logs: bool = False,
    on_enqueue: Callable[[str], None] | None = None,
    on_queue_update: Callable[[Dict[str, Any]], None] | None = None,
) -> Dict[str, Any]:
    """Asynchronous subscribe implementation."""
    pass
```

### 3. Error Handling

#### Exception Hierarchy
```python
class SunraException(Exception):
    """Base exception for all Sunra-related errors."""

    def __init__(self, message: str, code: str | None = None, details: Dict[str, Any] | None = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

class SunraValidationException(SunraException):
    """Raised when input validation fails."""
    pass

class SunraApiException(SunraException):
    """Raised when API requests fail."""

    def __init__(self, message: str, status_code: int, response_data: Dict[str, Any] | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data or {}

class SunraTimeoutException(SunraException):
    """Raised when requests timeout."""
    pass
```

#### Error Handling Patterns
```python
# Synchronous error handling
try:
    result = client.subscribe(endpoint_id, arguments=input_data)
    return result
except SunraValidationException as e:
    logger.error(f"Validation error: {e.message}")
    raise ValueError(f"Invalid input: {e.message}") from e
except SunraApiException as e:
    logger.error(f"API error (status {e.status_code}): {e.message}")
    raise
except SunraException as e:
    logger.error(f"Sunra error: {e.message}")
    raise

# Asynchronous error handling
async def handle_async_request():
    try:
        result = await client.subscribe_async(endpoint_id, arguments=input_data)
        return result
    except httpx.TimeoutException:
        raise SunraTimeoutException("Request timed out")
    except httpx.HTTPStatusError as e:
        raise SunraApiException(
            f"HTTP {e.response.status_code}: {e.response.text}",
            status_code=e.response.status_code,
            response_data=e.response.json() if e.response.headers.get("content-type") == "application/json" else {}
        )
```

### 4. HTTP Client Implementation

#### HTTPX Integration
```python
import httpx
from typing import Dict, Any, Optional

class HttpClient:
    """HTTP client wrapper with authentication and error handling."""

    def __init__(self, credentials: str, timeout: float = 300.0):
        self._credentials = credentials
        self._timeout = timeout

        # Common headers
        self._headers = {
            "Authorization": f"Bearer {credentials}",
            "Content-Type": "application/json",
            "User-Agent": f"sunra-python-client/{__version__}",
        }

    def _get_sync_client(self) -> httpx.Client:
        """Get synchronous HTTP client."""
        return httpx.Client(
            headers=self._headers,
            timeout=self._timeout,
            follow_redirects=True,
        )

    def _get_async_client(self) -> httpx.AsyncClient:
        """Get asynchronous HTTP client."""
        return httpx.AsyncClient(
            headers=self._headers,
            timeout=self._timeout,
            follow_redirects=True,
        )
```

#### Request/Response Handling
```python
# Synchronous request
def make_request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
    """Make synchronous HTTP request."""
    with self._get_sync_client() as client:
        response = client.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()

# Asynchronous request
async def make_request_async(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
    """Make asynchronous HTTP request."""
    async with self._get_async_client() as client:
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()

# File upload handling
def upload_file(self, file_path: str, content_type: str | None = None) -> str:
    """Upload file and return URL."""
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, content_type)}
        response = self.make_request("POST", "/upload", files=files)
        return response["url"]
```

### 5. Queue Operations

#### Queue Client Implementation
```python
from typing import Callable, Dict, Any, Optional
import time

class QueueClient:
    """Client for queue operations."""

    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def submit(self, endpoint_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit request to queue."""
        payload = {
            "endpoint_id": endpoint_id,
            "input": input_data,
        }
        return self._http_client.make_request("POST", "/queue/submit", json=payload)

    def status(self, request_id: str, include_logs: bool = False) -> Dict[str, Any]:
        """Get request status."""
        params = {"request_id": request_id}
        if include_logs:
            params["logs"] = "true"
        return self._http_client.make_request("GET", "/queue/status", params=params)

    def result(self, request_id: str) -> Dict[str, Any]:
        """Get request result."""
        params = {"request_id": request_id}
        return self._http_client.make_request("GET", "/queue/result", params=params)

    def cancel(self, request_id: str) -> Dict[str, Any]:
        """Cancel request."""
        payload = {"request_id": request_id}
        return self._http_client.make_request("POST", "/queue/cancel", json=payload)

    def subscribe(
        self,
        endpoint_id: str,
        input_data: Dict[str, Any],
        on_enqueue: Callable[[str], None] | None = None,
        on_queue_update: Callable[[Dict[str, Any]], None] | None = None,
        poll_interval: float = 1.0,
        timeout: float = 300.0,
    ) -> Dict[str, Any]:
        """Subscribe to queue with polling."""
        # Submit request
        submit_result = self.submit(endpoint_id, input_data)
        request_id = submit_result["request_id"]

        if on_enqueue:
            on_enqueue(request_id)

        # Poll for completion
        start_time = time.time()
        while time.time() - start_time < timeout:
            status_result = self.status(request_id, include_logs=True)

            if on_queue_update:
                on_queue_update(status_result)

            if status_result["status"] in ["COMPLETED", "FAILED", "CANCELLED"]:
                if status_result["status"] == "COMPLETED":
                    return self.result(request_id)
                else:
                    raise SunraException(f"Request {status_result['status'].lower()}: {status_result.get('error', 'Unknown error')}")

            time.sleep(poll_interval)

        raise SunraTimeoutException(f"Request {request_id} timed out after {timeout} seconds")
```

### 6. Configuration Management

#### Configuration Classes
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ClientConfig:
    """Configuration for Sunra client."""

    credentials: str | None = None
    api_endpoint: str | None = None
    queue_domain: str | None = None
    timeout: float = 300.0
    max_retries: int = 3
    retry_delay: float = 1.0

    @classmethod
    def from_env(cls) -> "ClientConfig":
        """Create configuration from environment variables."""
        return cls(
            credentials=os.getenv("SUNRA_KEY"),
            api_endpoint=os.getenv("SUNRA_API_ENDPOINT"),
            queue_domain=os.getenv("SUNRA_QUEUE_DOMAIN"),
        )

    def validate(self) -> None:
        """Validate configuration."""
        if not self.credentials:
            raise SunraValidationException("SUNRA_KEY is required")
        if self.timeout <= 0:
            raise SunraValidationException("Timeout must be positive")
```

### 7. Testing Standards

#### Testing Framework
- Use **pytest** for testing framework
- Use **pytest-asyncio** for async testing
- Use **pytest-mock** for mocking
- Use **httpx** mock for HTTP testing

#### Test Structure
```python
import pytest
import pytest_asyncio
from unittest.mock import Mock, patch
import httpx

from sunra_client import SunraClient
from sunra_client.exceptions import SunraException, SunraValidationException

class TestSunraClient:
    """Test cases for SunraClient."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return SunraClient(credentials="test-key")

    @pytest.fixture
    def mock_response(self):
        """Mock HTTP response."""
        return {
            "request_id": "test-123",
            "status": "COMPLETED",
            "data": {"result": "success"}
        }

    def test_subscribe_success(self, client, mock_response):
        """Test successful subscribe."""
        with patch.object(client._queue_client, 'subscribe', return_value=mock_response):
            result = client.subscribe("test-endpoint", arguments={"prompt": "test"})
            assert result["request_id"] == "test-123"

    def test_subscribe_validation_error(self, client):
        """Test validation error handling."""
        with pytest.raises(SunraValidationException):
            client.subscribe("", arguments={})

    @pytest_asyncio.async_test
    async def test_subscribe_async_success(self, client, mock_response):
        """Test successful async subscribe."""
        with patch.object(client._queue_client, 'subscribe_async', return_value=mock_response):
            result = await client.subscribe_async("test-endpoint", arguments={"prompt": "test"})
            assert result["request_id"] == "test-123"
```

#### Integration Testing
```python
import pytest
import os

@pytest.mark.integration
class TestIntegration:
    """Integration tests requiring real API key."""

    @pytest.fixture(scope="class")
    def real_client(self):
        """Create client with real API key."""
        api_key = os.getenv("SUNRA_KEY")
        if not api_key:
            pytest.skip("SUNRA_KEY not set")
        return SunraClient(credentials=api_key)

    def test_real_api_call(self, real_client):
        """Test real API call."""
        result = real_client.subscribe(
            "test-endpoint",
            arguments={"prompt": "test prompt"}
        )
        assert "request_id" in result
```

### 8. Package Management

#### pyproject.toml Configuration
```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "sunra-client"
version = "0.1.0"
description = "Python client for Sunra.ai API"
readme = "README.md"
license = {text = "Apache-2.0"}
authors = [
    {name = "Sunra Team", email = "support@sunra.ai"}
]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: Apache Software License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
requires-python = ">=3.8"
dependencies = [
    "httpx>=0.25.0",
    "pydantic>=2.0.0",
    "typing-extensions>=4.0.0; python_version<'3.10'",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.21.0",
    "pytest-mock>=3.10.0",
    "pytest-cov>=4.0.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.0.0",
]

[project.urls]
Homepage = "https://github.com/sunra-ai/sunra-clients"
Documentation = "https://docs.sunra.ai"
Repository = "https://github.com/sunra-ai/sunra-clients"
Issues = "https://github.com/sunra-ai/sunra-clients/issues"

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]

[tool.ruff]
line-length = 120
target-version = "py38"
select = ["E", "F", "I", "B", "C4", "UP", "A"]
ignore = ["E501"]  # Line too long (handled by black)

[tool.ruff.isort]
known-first-party = ["sunra_client"]

[tool.mypy]
python_version = "3.8"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--strict-config",
    "--cov=sunra_client",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-fail-under=80",
]
markers = [
    "integration: marks tests as integration tests (deselect with '-m \"not integration\"')",
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
]
```

### 9. Documentation Standards

#### Docstring Format
```python
def subscribe(
    self,
    endpoint_id: str,
    arguments: Dict[str, Any],
    with_logs: bool = False,
    on_enqueue: Callable[[str], None] | None = None,
    on_queue_update: Callable[[Dict[str, Any]], None] | None = None,
) -> Dict[str, Any]:
    """Submit a request to the Sunra queue and wait for completion.

    Args:
        endpoint_id: The ID of the API endpoint to submit to.
        arguments: The input data to send to the endpoint.
        with_logs: Whether to include logs in status updates.
        on_enqueue: Callback function called when request is enqueued.
        on_queue_update: Callback function called on status updates.

    Returns:
        The completed request result containing the generated output.

    Raises:
        SunraValidationException: If input parameters are invalid.
        SunraApiException: If the API request fails.
        SunraTimeoutException: If the request times out.

    Example:
        >>> client = SunraClient(credentials="your-api-key")
        >>> result = client.subscribe(
        ...     "text-to-image",
        ...     arguments={"prompt": "A beautiful sunset"},
        ...     with_logs=True
        ... )
        >>> print(result["data"]["image_url"])
    """
```

### 10. Performance Considerations

#### Async/Await Best Practices
```python
import asyncio
from typing import List, Dict, Any

async def batch_subscribe(
    client: SunraClient,
    requests: List[Dict[str, Any]],
    max_concurrent: int = 10,
) -> List[Dict[str, Any]]:
    """Submit multiple requests concurrently."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def submit_single(request_data: Dict[str, Any]) -> Dict[str, Any]:
        async with semaphore:
            return await client.subscribe_async(**request_data)

    tasks = [submit_single(request) for request in requests]
    return await asyncio.gather(*tasks)

# Connection pooling
class OptimizedClient:
    def __init__(self):
        # Reuse connections
        self._client = httpx.AsyncClient(
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._client.aclose()
```

### 11. Security Best Practices

#### Credential Management
```python
import os
from typing import Optional

class CredentialsResolver:
    """Secure credential resolution."""

    @staticmethod
    def from_environment() -> str:
        """Get credentials from environment."""
        api_key = os.getenv("SUNRA_KEY")
        if not api_key:
            raise SunraValidationException(
                "SUNRA_KEY environment variable is required. "
                "Get your API key from https://sunra.ai/dashboard/api-tokens"
            )
        return api_key

    @staticmethod
    def validate_key_format(api_key: str) -> bool:
        """Validate API key format."""
        # Basic format validation
        if not api_key or len(api_key) < 10:
            return False
        # Add more specific validation as needed
        return True

    @staticmethod
    def mask_key_for_logging(api_key: str) -> str:
        """Mask API key for safe logging."""
        if len(api_key) <= 8:
            return "***"
        return api_key[:4] + "***" + api_key[-4:]
```

### 12. Logging and Monitoring

#### Logging Configuration
```python
import logging
from typing import Any, Dict

# Configure logger
logger = logging.getLogger("sunra_client")

class SunraClient:
    def __init__(self, credentials: str, **kwargs):
        self._credentials = credentials
        # Never log the actual credentials
        logger.info(f"Initializing Sunra client with key: {self._mask_key(credentials)}")

    def _mask_key(self, key: str) -> str:
        """Mask API key for logging."""
        return key[:4] + "***" + key[-4:] if len(key) > 8 else "***"

    def subscribe(self, endpoint_id: str, **kwargs) -> Dict[str, Any]:
        """Subscribe with logging."""
        logger.info(f"Submitting request to endpoint: {endpoint_id}")

        try:
            result = self._queue_client.subscribe(endpoint_id, **kwargs)
            logger.info(f"Request completed successfully: {result.get('request_id')}")
            return result
        except Exception as e:
            logger.error(f"Request failed for endpoint {endpoint_id}: {str(e)}")
            raise

# Performance monitoring
import time
from functools import wraps

def monitor_performance(func):
    """Decorator to monitor function performance."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {str(e)}")
            raise
    return wrapper
```

### 13. Deployment and Distribution

#### PyPI Publishing
```python
# setup.py for legacy compatibility
from setuptools import setup, find_packages

setup(
    name="sunra-client",
    use_scm_version=True,
    setup_requires=["setuptools_scm"],
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
)
```

#### Version Management
```python
# src/sunra_client/__init__.py
"""Sunra Python Client Library."""

__version__ = "0.1.0"
__author__ = "Sunra Team"
__email__ = "support@sunra.ai"

# Public API
from .client import SunraClient
from .exceptions import SunraException, SunraValidationException, SunraApiException

__all__ = [
    "SunraClient",
    "SunraException",
    "SunraValidationException",
    "SunraApiException",
]
```

### 14. Makefile for Development

```makefile
# Makefile for Python SDK development
.PHONY: install test lint format type-check build clean

install:
	pip install -e ".[dev]"

test:
	pytest tests/ -v

test-integration:
	pytest tests/ -v -m integration

lint:
	ruff check src/ tests/

format:
	ruff format src/ tests/

type-check:
	mypy src/

build:
	python -m build

clean:
	rm -rf build/ dist/ *.egg-info/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

publish-test:
	twine upload --repository testpypi dist/*

publish:
	twine upload dist/*

all: format lint type-check test build
```

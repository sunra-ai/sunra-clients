import asyncio
import base64
import io
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock, AsyncMock
import pytest
from PIL import Image

from sunra_client.client import AsyncClient, SyncClient


class TestAsyncTransformInput:
    """Test cases for AsyncClient.transform_input method."""

    @pytest.fixture
    def client(self):
        """Create a mock async client for testing."""
        with patch('sunra_client.client.fetch_credentials', return_value='test-key'):
            return AsyncClient()

    @pytest.mark.asyncio
    async def test_transform_basic_types(self, client):
        """Test that basic types are returned unchanged."""
        # Test string
        result = await client.transform_input("hello world")
        assert result == "hello world"

        # Test integer
        result = await client.transform_input(42)
        assert result == 42

        # Test float
        result = await client.transform_input(3.14)
        assert result == 3.14

        # Test boolean
        result = await client.transform_input(True)
        assert result == True

        # Test None
        result = await client.transform_input(None)
        assert result is None

    @pytest.mark.asyncio
    async def test_transform_list(self, client):
        """Test transformation of lists with mixed content."""
        with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            input_list = [
                "keep this string",
                42,
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            ]

            result = await client.transform_input(input_list)

            assert len(result) == 3
            assert result[0] == "keep this string"
            assert result[1] == 42
            assert result[2] == "https://cdn.example.com/uploaded-data"  # Data URI should be uploaded

            # Verify upload was called for the data URI
            assert mock_upload.call_count == 1

    @pytest.mark.asyncio
    async def test_transform_dict(self, client):
        """Test transformation of dictionaries with mixed content."""
        with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            input_dict = {
                "text": "keep this",
                "number": 123,
                "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                "nested": {
                    "value": "also keep this",
                    "file": "data:text/plain;base64,SGVsbG8gV29ybGQ="
                }
            }

            result = await client.transform_input(input_dict)

            assert result["text"] == "keep this"
            assert result["number"] == 123
            assert result["image"] == "https://cdn.example.com/uploaded-data"
            assert result["nested"]["value"] == "also keep this"
            assert result["nested"]["file"] == "https://cdn.example.com/uploaded-data"

            # Verify upload was called twice (for both data URIs)
            assert mock_upload.call_count == 2

    @pytest.mark.asyncio
    async def test_transform_pil_image(self, client):
        """Test transformation of PIL Image objects."""
        with patch('sunra_client.client.AsyncClient.upload_image', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-image.jpg") as mock_upload_image:
            # Create a test PIL Image
            image = Image.new("RGB", (10, 10), color="red")

            result = await client.transform_input(image)

            assert result == "https://cdn.example.com/uploaded-image.jpg"
            # Verify upload_image was called with the image
            assert mock_upload_image.call_count == 1

    @pytest.mark.asyncio
    async def test_transform_data_uri(self, client):
        """Test transformation of base64 data URIs."""
        with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            # Test PNG data URI
            png_data_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

            result = await client.transform_input(png_data_uri)

            assert result == "https://cdn.example.com/uploaded-data"
            assert mock_upload.call_count == 1

    @pytest.mark.asyncio
    async def test_transform_file_path(self, client):
        """Test transformation of file paths."""
        with patch('sunra_client.client.AsyncClient.upload_file', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-file.txt") as mock_upload_file:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write("test content")
                temp_file_path = f.name

            try:
                result = await client.transform_input(temp_file_path)

                assert result == "https://cdn.example.com/uploaded-file.txt"
                assert mock_upload_file.call_count == 1
            finally:
                # Clean up
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

    @pytest.mark.asyncio
    async def test_transform_file_like_object(self, client):
        """Test transformation of file-like objects."""
        with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            # Create a file-like object
            content = b"This is test content"
            file_obj = io.BytesIO(content)
            file_obj.name = "test.txt"
            file_obj.content_type = "text/plain"

            result = await client.transform_input(file_obj)

            assert result == "https://cdn.example.com/uploaded-data"
            assert mock_upload.call_count == 1

    @pytest.mark.asyncio
    async def test_transform_file_like_object_without_name(self, client):
        """Test transformation of file-like objects without name attribute."""
        with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            content = b"Test content"
            file_obj = io.BytesIO(content)

            result = await client.transform_input(file_obj)

            assert result == "https://cdn.example.com/uploaded-data"
            assert mock_upload.call_count == 1

    @pytest.mark.asyncio
    async def test_transform_non_existent_file_path(self, client):
        """Test that non-existent file paths are not transformed."""
        with patch('sunra_client.client.AsyncClient.upload_file', new_callable=AsyncMock) as mock_upload_file:
            non_existent_path = "/this/path/does/not/exist.txt"

            result = await client.transform_input(non_existent_path)

            # Should return unchanged since file doesn't exist
            assert result == non_existent_path
            mock_upload_file.assert_not_called()

    @pytest.mark.asyncio
    async def test_transform_invalid_data_uri(self, client):
        """Test handling of invalid data URIs."""
        # Test invalid base64 data - should fail at base64 decoding step
        invalid_data_uri = "data:image/png;base64,invalid_base64_data"

        with pytest.raises(Exception, match="Invalid base64-encoded string"):
            await client.transform_input(invalid_data_uri)

    @pytest.mark.asyncio
    async def test_transform_nested_complex_structure(self, client):
        """Test transformation of deeply nested structures."""
        with patch('sunra_client.client.AsyncClient.upload', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-data") as mock_upload, \
             patch('sunra_client.client.AsyncClient.upload_image', new_callable=AsyncMock, return_value="https://cdn.example.com/uploaded-image.jpg") as mock_upload_image:

            complex_input = {
                "images": [
                    Image.new("RGB", (5, 5), "blue"),
                    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k="
                ],
                "metadata": {
                    "settings": {
                        "quality": "high",
                        "reference_files": [
                            "data:text/plain;base64,SGVsbG8=",
                            {"nested_image": Image.new("RGB", (2, 2), "green")}
                        ]
                    }
                },
                "text": "Keep this unchanged"
            }

            result = await client.transform_input(complex_input)

            # Verify structure is preserved
            assert "images" in result
            assert "metadata" in result
            assert result["text"] == "Keep this unchanged"

            # Verify all images were uploaded
            assert len(result["images"]) == 2
            assert result["images"][0] == "https://cdn.example.com/uploaded-image.jpg"  # PIL Image
            assert result["images"][1] == "https://cdn.example.com/uploaded-data"  # Data URI

            # Verify nested transformations
            assert result["metadata"]["settings"]["quality"] == "high"
            assert len(result["metadata"]["settings"]["reference_files"]) == 2
            assert result["metadata"]["settings"]["reference_files"][0] == "https://cdn.example.com/uploaded-data"
            assert result["metadata"]["settings"]["reference_files"][1]["nested_image"] == "https://cdn.example.com/uploaded-image.jpg"


class TestSyncTransformInput:
    """Test cases for SyncClient.transform_input method."""

    @pytest.fixture
    def client(self):
        """Create a mock sync client for testing."""
        with patch('sunra_client.client.fetch_credentials', return_value='test-key'):
            return SyncClient()

    def test_transform_basic_types(self, client):
        """Test that basic types are returned unchanged."""
        # Test string
        result = client.transform_input("hello world")
        assert result == "hello world"

        # Test integer
        result = client.transform_input(42)
        assert result == 42

        # Test None
        result = client.transform_input(None)
        assert result is None

    def test_transform_pil_image(self, client):
        """Test transformation of PIL Image objects."""
        with patch('sunra_client.client.SyncClient.upload_image', return_value="https://cdn.example.com/uploaded-image.jpg") as mock_upload_image:
            image = Image.new("RGB", (10, 10), color="red")

            result = client.transform_input(image)

            assert result == "https://cdn.example.com/uploaded-image.jpg"
            assert mock_upload_image.call_count == 1

    def test_transform_data_uri(self, client):
        """Test transformation of base64 data URIs."""
        with patch('sunra_client.client.SyncClient.upload', return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            data_uri = "data:text/plain;base64,SGVsbG8gV29ybGQ="

            result = client.transform_input(data_uri)

            assert result == "https://cdn.example.com/uploaded-data"
            assert mock_upload.call_count == 1

    def test_transform_file_path(self, client):
        """Test transformation of file paths."""
        with patch('sunra_client.client.SyncClient.upload_file', return_value="https://cdn.example.com/uploaded-file.txt") as mock_upload_file:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write("test content")
                temp_file_path = f.name

            try:
                result = client.transform_input(temp_file_path)

                assert result == "https://cdn.example.com/uploaded-file.txt"
                assert mock_upload_file.call_count == 1
            finally:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

    def test_transform_list_with_mixed_content(self, client):
        """Test transformation of lists with mixed content types."""
        with patch('sunra_client.client.SyncClient.upload', return_value="https://cdn.example.com/uploaded-data") as mock_upload, \
             patch('sunra_client.client.SyncClient.upload_image', return_value="https://cdn.example.com/uploaded-image.jpg") as mock_upload_image:

            input_list = [
                "text",
                Image.new("RGB", (5, 5), "blue"),
                42,
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            ]

            result = client.transform_input(input_list)

            assert len(result) == 4
            assert result[0] == "text"
            assert result[1] == "https://cdn.example.com/uploaded-image.jpg"
            assert result[2] == 42
            assert result[3] == "https://cdn.example.com/uploaded-data"

    def test_transform_dict_recursive(self, client):
        """Test recursive transformation of nested dictionaries."""
        with patch('sunra_client.client.SyncClient.upload', return_value="https://cdn.example.com/uploaded-data") as mock_upload, \
             patch('sunra_client.client.SyncClient.upload_image', return_value="https://cdn.example.com/uploaded-image.jpg") as mock_upload_image:

            input_dict = {
                "level1": {
                    "level2": {
                        "image": Image.new("RGB", (3, 3), "yellow"),
                        "text": "unchanged"
                    },
                    "data": "data:application/json;base64,eyJ0ZXN0IjoidmFsdWUifQ=="
                },
                "simple": "value"
            }

            result = client.transform_input(input_dict)

            assert result["simple"] == "value"
            assert result["level1"]["level2"]["text"] == "unchanged"
            assert result["level1"]["level2"]["image"] == "https://cdn.example.com/uploaded-image.jpg"
            assert result["level1"]["data"] == "https://cdn.example.com/uploaded-data"

    def test_transform_error_handling(self, client):
        """Test error handling during transformation."""
        with patch('sunra_client.client.SyncClient.upload_image', side_effect=Exception("Upload failed")) as mock_upload_image:
            image = Image.new("RGB", (1, 1), "red")

            with pytest.raises(Exception, match="Upload failed"):
                client.transform_input(image)

    def test_file_like_object_with_seek(self, client):
        """Test file-like object that supports seek operation."""
        with patch('sunra_client.client.SyncClient.upload', return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            content = b"Test file content"
            file_obj = io.BytesIO(content)
            file_obj.name = "test.bin"

            # Mock to verify seek is called
            file_obj.seek = Mock()

            result = client.transform_input(file_obj)

            assert result == "https://cdn.example.com/uploaded-data"
            # Verify seek was called to reset file pointer
            file_obj.seek.assert_called_once_with(0)

    def test_transform_empty_containers(self, client):
        """Test transformation of empty lists and dictionaries."""
        # Empty list
        result = client.transform_input([])
        assert result == []

        # Empty dict
        result = client.transform_input({})
        assert result == {}

    def test_data_uri_content_type_extraction(self, client):
        """Test proper content type extraction from data URIs."""
        with patch('sunra_client.client.SyncClient.upload', return_value="https://cdn.example.com/uploaded-data") as mock_upload:
            test_cases = [
                "data:image/jpeg;base64,/9j/4AAQ",
                "data:text/html;base64,PGh0bWw+",
                "data:application/pdf;base64,JVBERi0x"
            ]

            for data_uri in test_cases:
                mock_upload.reset_mock()
                client.transform_input(data_uri)
                assert mock_upload.call_count == 1


class TestTransformInputIntegration:
    """Integration tests for transform_input functionality."""

    @pytest.mark.asyncio
    async def test_async_submit_integration(self):
        """Test that submit() automatically calls transform_input."""
        with patch('sunra_client.client.fetch_credentials', return_value='test-key'):
            # Mock transform_input at the class level to track calls
            with patch('sunra_client.client.AsyncClient.transform_input', new_callable=AsyncMock, return_value={"transformed": True}) as mock_transform:
                client = AsyncClient()

                # Mock the HTTP client and response
                mock_response = Mock()
                mock_response.json.return_value = {
                    "request_id": "test-id",
                    "response_url": "test-url",
                    "status_url": "test-status",
                    "cancel_url": "test-cancel"
                }

                with patch('sunra_client.client._async_maybe_retry_request', return_value=mock_response):
                    await client.submit("test-app", {"image": "data:image/png;base64,test"})

                    # Verify transform_input was called on the instance
                    assert mock_transform.call_count == 1

    def test_sync_submit_integration(self):
        """Test that sync submit() automatically calls transform_input."""
        with patch('sunra_client.client.fetch_credentials', return_value='test-key'):
            # Mock transform_input at the class level to track calls
            with patch('sunra_client.client.SyncClient.transform_input', return_value={"transformed": True}) as mock_transform:
                client = SyncClient()

                # Mock the HTTP client and response
                mock_response = Mock()
                mock_response.json.return_value = {
                    "request_id": "test-id",
                    "response_url": "test-url",
                    "status_url": "test-status",
                    "cancel_url": "test-cancel"
                }

                with patch('sunra_client.client._maybe_retry_request', return_value=mock_response):
                    client.submit("test-app", {"file": "/path/to/file.txt"})

                    # Verify transform_input was called on the instance
                    assert mock_transform.call_count == 1

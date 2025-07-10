import io

from dotenv import load_dotenv
import httpx
from PIL import Image
import pytest

import sunra_client
from sunra_client.client import SunraClientError

load_dotenv()


@pytest.fixture
def client() -> sunra_client.SyncClient:
    client = sunra_client.SyncClient()
    try:
        client._get_key()
    except sunra_client.auth.MissingCredentialsError:
        pytest.skip("Missing credentials")
    return client


def test_sunra_client(client: sunra_client.SyncClient):
    handle = client.submit(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "an orange cat",
        },
    )

    result = handle.get()

    assert client.result(handle.request_id) == result

    status = handle.status()
    assert isinstance(status, sunra_client.Completed)

    output = client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "a cat",
        },
    )
    assert "images" in output
    assert isinstance(output["images"], list)
    assert len(output["images"]) > 0
    assert isinstance(output["images"][0], dict)
    assert "content_type" in output["images"][0]
    assert "file_name" in output["images"][0]
    assert "file_size" in output["images"][0]
    assert "url" in output["images"][0]


def test_sunra_client_streaming(client: sunra_client.SyncClient):
    events = []
    for event in client.stream(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "an orange cat",
        },
    ):
        events.append(event)
        print(event)

    assert len(events) >= 2
    assert events[-1].get("status") == "COMPLETED"


def test_sunra_client_upload(
    client: sunra_client.SyncClient,
    tmp_path,
):
    image = Image.new("RGB", (100, 100))

    url = client.upload_image(image)
    response = httpx.get(url)
    response.raise_for_status()

    response_image = Image.open(io.BytesIO(response.content))
    assert response_image.size == (100, 100)
    assert response_image.mode == "RGB"
    assert response_image.getpixel((0, 0)) == (0, 0, 0)


def test_sunra_client_upload_bytes(client: sunra_client.SyncClient):
    """Test uploading raw bytes data"""
    test_data = b"Hello, World! This is test binary data."
    content_type = "application/octet-stream"

    url = client.upload(test_data, content_type, "test.bin")
    response = httpx.get(url)
    response.raise_for_status()

    assert response.content == test_data
    assert response.headers.get("content-type") == content_type


def test_sunra_client_upload_string(client: sunra_client.SyncClient):
    """Test uploading string data"""
    test_string = "Hello, World! This is test string data."
    content_type = "text/plain"

    url = client.upload(test_string, content_type, "test.txt")
    response = httpx.get(url)
    response.raise_for_status()

    assert response.content == test_string.encode("utf-8")
    assert response.headers.get("content-type") == content_type


def test_sunra_client_upload_json(client: sunra_client.SyncClient):
    """Test uploading JSON data"""
    test_json = '{"key": "value", "number": 42, "array": [1, 2, 3]}'
    content_type = "application/json"

    url = client.upload(test_json, content_type, "test.json")
    response = httpx.get(url)
    response.raise_for_status()

    assert response.content == test_json.encode("utf-8")
    assert response.headers.get("content-type") == content_type


def test_sunra_client_upload_file_text(client: sunra_client.SyncClient, tmp_path):
    """Test uploading a text file"""
    test_file = tmp_path / "test.txt"
    test_content = "This is a test file content.\nLine 2\nLine 3"
    test_file.write_text(test_content)

    url = client.upload_file(test_file)
    response = httpx.get(url)
    response.raise_for_status()

    assert response.content == test_content.encode("utf-8")
    assert response.headers.get("content-type") == "text/plain"


def test_sunra_client_upload_file_binary(client: sunra_client.SyncClient, tmp_path):
    """Test uploading a binary file"""
    test_file = tmp_path / "test.bin"
    test_content = b"\x00\x01\x02\x03\x04\x05Binary data test"
    test_file.write_bytes(test_content)

    url = client.upload_file(test_file)
    response = httpx.get(url)
    response.raise_for_status()

    assert response.content == test_content
    assert response.headers.get("content-type") == "application/octet-stream"


def test_sunra_client_upload_file_image(client: sunra_client.SyncClient, tmp_path):
    """Test uploading an image file"""
    test_file = tmp_path / "test.png"
    image = Image.new("RGB", (50, 50), color="red")
    image.save(test_file, "PNG")

    url = client.upload_file(test_file)
    response = httpx.get(url)
    response.raise_for_status()

    # Verify the uploaded image
    response_image = Image.open(io.BytesIO(response.content))
    assert response_image.size == (50, 50)
    assert response_image.mode == "RGB"
    assert response.headers.get("content-type") == "image/png"


def test_sunra_client_upload_file_empty(client: sunra_client.SyncClient, tmp_path):
    """Test uploading an empty file"""
    test_file = tmp_path / "empty.txt"
    test_file.write_text("")

    url = client.upload_file(test_file)
    response = httpx.get(url)
    response.raise_for_status()

    assert response.content == b""
    assert response.headers.get("content-type") == "text/plain"


def test_sunra_client_upload_file_no_extension(client: sunra_client.SyncClient, tmp_path):
    """Test uploading a file without extension - should raise an error"""
    test_file = tmp_path / "noextension"
    test_content = "File without extension"
    test_file.write_text(test_content)

    # Server rejects files without extensions
    with pytest.raises(SunraClientError) as exc_info:
        client.upload_file(test_file)

    assert "Invalid filename" in str(exc_info.value)

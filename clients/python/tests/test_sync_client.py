import io
import pytest
import sunra_client
import httpx
from PIL import Image
from dotenv import load_dotenv

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
        "sunra/fast-animatediff/text-to-video",
        arguments={
            "prompt": "an orange cat",
        },
    )

    result = handle.get()

    assert (
        client.result(handle.request_id)
        == result
    )

    status = handle.status()
    assert isinstance(status, sunra_client.Completed)


    output = client.subscribe(
        "sunra/fast-animatediff/text-to-video",
        arguments={
            "prompt": "a cat",
        },
    )
    assert "video" in output
    assert isinstance(output["video"], dict)
    assert "url" in output["video"]



def test_sunra_client_streaming(client: sunra_client.SyncClient):
    handle = client.submit(
        "sunra/fast-animatediff/text-to-video",
        arguments={
            "prompt": "an orange cat",
        },
    )
    events = []
    for event in client.stream(
        handle.request_id,
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


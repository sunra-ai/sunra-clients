import io
import httpx
import pytest
import sunra_client
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

pytestmark = pytest.mark.asyncio

@pytest.fixture
async def client() -> sunra_client.AsyncClient:
    client = sunra_client.AsyncClient()
    try:
        client._get_key()
    except sunra_client.auth.MissingCredentialsError:
        pytest.skip("No credentials found")
    return client


async def test_sunra_client(client: sunra_client.AsyncClient):

    handle = await client.submit(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "an orange cat",
        },
    )

    result = await handle.get()

    assert (
        await client.result(handle.request_id)
        == result
    )

    status = await handle.status()
    assert isinstance(status, sunra_client.Completed)

    output = await client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "a cat",
        },
    )
    assert "images" in output
    assert isinstance(output["images"], dict)


async def test_sunra_client_streaming(client: sunra_client.AsyncClient):
    events = []
    async for event in client.stream(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "an orange cat",
        },
    ):
      events.append(event)
      print(event)

    assert len(events) >= 2
    assert events[-1].get("status") == "COMPLETED"


@pytest.mark.asyncio
async def test_sunra_client_upload(
    client: sunra_client.AsyncClient,
    tmp_path,
):
    async with httpx.AsyncClient() as httpx_client:
        image = Image.new("RGB", (100, 100))

        url = await client.upload_image(image)
        response = await httpx_client.get(url)
        response.raise_for_status()

        response_image = Image.open(io.BytesIO(response.content))
        assert response_image.size == (100, 100)
        assert response_image.mode == "RGB"
        assert response_image.getpixel((0, 0)) == (0, 0, 0)

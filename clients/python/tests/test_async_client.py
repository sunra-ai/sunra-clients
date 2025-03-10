import io
import httpx
import pytest
import sunra_client
from PIL import Image


@pytest.fixture
async def client() -> sunra_client.AsyncClient:
    client = sunra_client.AsyncClient()
    try:
        client._get_key()
    except sunra_client.auth.MissingCredentialsError:
        pytest.skip("No credentials found")
    return client


async def test_sunra_client(client: sunra_client.AsyncClient):
    output = await client.run(
        "sunra-ai/fast-sdxl",
        arguments={
            "prompt": "a cat",
        },
    )
    assert len(output["images"]) == 1

    handle = await client.submit(
        "sunra-ai/fast-sdxl/image-to-image",
        arguments={
            "image_url": output["images"][0]["url"],
            "prompt": "an orange cat",
            "seed": 42,
        },
    )

    result = await handle.get()
    assert result["seed"] == 42

    assert (
        await client.result("sunra-ai/fast-sdxl/image-to-image", handle.request_id)
        == result
    )

    status = await handle.status(with_logs=False)
    assert isinstance(status, sunra_client.Completed)
    assert status.logs is None

    new_handle = client.get_handle(
        "sunra-ai/fast-sdxl/image-to-image", handle.request_id
    )
    assert new_handle == handle

    status_w_logs = await handle.status(with_logs=True)
    assert isinstance(status_w_logs, sunra_client.Completed)
    assert status_w_logs.logs is not None

    assert (
        await client.status(
            "sunra-ai/fast-sdxl/image-to-image",
            handle.request_id,
        )
        == status
    )

    output = await client.subscribe(
        "sunra-ai/fast-sdxl",
        arguments={
            "prompt": "a cat",
        },
        hint="lora:a",
    )
    assert len(output["images"]) == 1

    output = await client.run(
        "sunra-ai/fast-sdxl",
        arguments={
            "prompt": "a cat",
        },
        hint="lora:a",
    )
    assert len(output["images"]) == 1


async def test_sunra_client_streaming(client: sunra_client.AsyncClient):
    events = []
    async for event in client.stream(
        "sunra-ai/llavav15-13b",
        arguments={
            "image_url": "https://llava-vl.github.io/static/images/monalisa.jpg",
            "prompt": "Do you know who drew this painting?",
        },
    ):
        events.append(event)
        print(event)

    assert len(events) >= 2
    assert not events[-1]["partial"]


async def test_sunra_client_upload(
    client: sunra_client.AsyncClient,
    tmp_path,
):
    async with httpx.AsyncClient() as httpx_client:
        url = await client.upload(b"Hello, world!", content_type="text/plain")
        response = await httpx_client.get(url)
        response.raise_for_status()

        assert response.text == "Hello, world!"

        fake_file = tmp_path / "fake.txt"
        fake_file.write_text("from fake.txt")

        url = await client.upload_file(fake_file)
        response = await httpx_client.get(url)
        response.raise_for_status()

        assert response.text == "from fake.txt"

        image = Image.new("RGB", (100, 100))

        url = await client.upload_image(image)
        response = await httpx_client.get(url)
        response.raise_for_status()

        response_image = Image.open(io.BytesIO(response.content))
        assert response_image.size == (100, 100)
        assert response_image.mode == "RGB"
        assert response_image.getpixel((0, 0)) == (0, 0, 0)

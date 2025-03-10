# sunra.ai Python client

This is a Python client library for interacting with ML models deployed on [sunra.ai](https://sunra.ai).

## Getting started

To install the client, run:

```bash
pip install sunra-client
```

To use the client, you need to have an API key. You can get one by signing up at [sunra.ai](https://sunra.ai). Once you have it, set
it as an environment variable:

```bash
export SUNRA_KEY=your-api-key
```

Now you can use the client to interact with your models. Here's an example of how to use it:

```python
import sunra_client

response = sunra_client.run("sunra-ai/fast-sdxl", arguments={"prompt": "a cute cat, realistic, orange"})
print(response["images"][0]["url"])
```

## Asynchronous requests

The client also supports asynchronous requests out of the box. Here's an example:

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.run_async("sunra-ai/fast-sdxl", arguments={"prompt": "a cute cat, realistic, orange"})
    print(response["images"][0]["url"])


asyncio.run(main())
```

## Uploading files

If the model requires files as input, you can upload them directly to sunra.media (our CDN) and pass the URLs to the client. Here's an example:

```python
import sunra_client

audio_url = sunra_client.upload_file("path/to/audio.wav")
response = sunra_client.run("sunra-ai/whisper", arguments={"audio_url": audio_url})
print(response["text"])
```

## Encoding files as in-memory data URLs

If you don't want to upload your file to our CDN service (for latency reasons, for example), you can encode it as a data URL and pass it directly to the client. Here's an example:

```python
import sunra_client

audio_data_url = sunra_client.encode_file("path/to/audio.wav")
response = sunra_client.run("sunra-ai/whisper", arguments={"audio_url": audio_data_url})
print(response["text"])
```

## Queuing requests

When you want to send a request and keep receiving updates on its status, you can use the `submit` method. Here's an example:

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.submit_async("sunra-ai/fast-sdxl", arguments={"prompt": "a cute cat, realistic, orange"})

    logs_index = 0
    async for event in response.iter_events(with_logs=True):
        if isinstance(event, sunra_client.Queued):
            print("Queued. Position:", event.position)
        elif isinstance(event, (sunra_client.InProgress, sunra_client.Completed)):
            new_logs = event.logs[logs_index:]
            for log in new_logs:
                print(log["message"])
            logs_index = len(event.logs)

    result = await response.get()
    print(result["images"][0]["url"])


asyncio.run(main())
```

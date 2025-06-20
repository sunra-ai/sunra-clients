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

response = sunra_client.subscribe(
  "black-forest-labs/flux-kontext-pro/text-to-image",
  arguments={
    "prompt": "a cute cat, realistic, orange"
  }
)
print(response["images"][0]["url"])
```

## streaming responses
```python
import sunra_client

application = "black-forest-labs/flux-kontext-pro/text-to-image"
arguments={"prompt": "a cute cat, realistic, orange"}

for event in sunra_client.stream(application, arguments):
    print(f"Received event: {event}")
```

## Asynchronous requests

The client also supports asynchronous requests out of the box. Here's an example:

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.subscribe_async("black-forest-labs/flux-kontext-pro/text-to-image", arguments={"prompt": "a cute cat, realistic, orange"})
    print(response["images"][0]["url"])


asyncio.run(main())
```


## Queuing requests

When you want to send a request and keep receiving updates on its status, you can use the `submit` method. Here's an example:

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.submit_async("black-forest-labs/flux-kontext-pro/text-to-image", arguments={"prompt": "a cute cat, realistic, orange"})

    logs_index = 0
    async for event in response.iter_events():
        if isinstance(event, sunra_client.Queued):
            print("Queued. Position:", event.position)
        elif isinstance(event, (sunra_client.InProgress, sunra_client.Completed)):
            print(event)

    result = await response.get()
    print(result["images"][0]["url"])


asyncio.run(main())
```

## Credits

This project is derived from

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original project is licensed under the MIT/Apache2.0 License. We extend our gratitude to the original authors for their contributions.

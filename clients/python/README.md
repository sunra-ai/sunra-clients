# sunra.ai Python Client

This is a Python client library for interacting with ML models deployed on [sunra.ai](https://sunra.ai).

## Getting Started

To install the client, run:

```bash
pip install sunra-client
```

Before using the client, you'll need to:

1. Sign up at [sunra.ai](https://sunra.ai)
2. Get your API key from the [dashboard](https://sunra.ai/dashboard/keys)
3. Set your API key as an environment variable: `export SUNRA_KEY=your-api-key` 

## Configuration

There are two ways to configure your API key:

### Method 1: Global Configuration (Recommended)

```python
import sunra_client

# Configure the client with your API key
sunra_client.config(credentials="your-api-key")

# Now you can use the client without passing the key explicitly
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={"prompt": "a cute cat, realistic, orange"}
)
```

### Method 2: Environment Variable

Set your API key as an environment variable:

```bash
export SUNRA_KEY=your-api-key
```

### Method 3: Explicit Client Configuration

```python
import sunra_client

# Create a client with explicit API key
client = sunra_client.SyncClient(key="your-api-key")

# Or for async client
async_client = sunra_client.AsyncClient(key="your-api-key")
```

## Usage Examples

Now you can use the client to interact with your models. Here's an example of how to use it:

```python
import sunra_client

response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={
      "prompt": "a cute cat, realistic, orange"
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print
)
print(response["images"][0]["url"])
```

## Streaming Responses

You can stream real-time updates as your request is being processed:

```python
import sunra_client

application = "black-forest-labs/flux-kontext-pro/text-to-image"
arguments = {"prompt": "a cute cat, realistic, orange"}

for event in sunra_client.stream(application, arguments):
    print(f"Received event: {event}")
```

## Asynchronous Requests

The client also supports asynchronous requests out of the box. Here's an example:

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.subscribe_async(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "a cute cat, realistic, orange"}
        with_logs=True,
        on_enqueue=print,
        on_queue_update=print
    )
    print(response["images"][0]["url"])

asyncio.run(main())
```

## Queuing Requests

When you want to send a request and keep receiving updates on its status, you can use the `submit` method:

```python
import asyncio
import sunra_client

async def main():
    response = await sunra_client.submit_async(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "a cute cat, realistic, orange"}
    )

    async for event in response.iter_events():
        if isinstance(event, sunra_client.Queued):
            print("Queued. Position:", event.position)
        elif isinstance(event, (sunra_client.InProgress, sunra_client.Completed)):
            print(event)

    result = await response.get()
    print(result["images"][0]["url"])

asyncio.run(main())
```

## File Upload Support

The client supports uploading files to sunra.ai:

```python
import sunra_client
from PIL import Image

# Create a sync client
client = sunra_client.SyncClient()

# Upload an image file
image = Image.new("RGB", (100, 100), color="red")
image_url = client.upload_image(image)

# Upload any file from local path
file_url = client.upload_file("path/to/your/file.txt")

# Upload raw data
data_url = client.upload(
    data=b"Hello, World!",
    content_type="text/plain",
    file_name="hello.txt"
)
```

**File Upload Limits:**
- Maximum file size: **100MB**
- Supported formats: Images, videos, audio, documents, and other file types as supported by the specific model

## Error Handling

The client provides comprehensive error handling with detailed error information:

```python
import sunra_client

try:
    response = sunra_client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "a cute cat, realistic, orange",
            "seed": -2  # Invalid seed (should be >= 0)
        },
        with_logs=True,
        on_enqueue=print,
        on_queue_update=print
    )
    print(response["images"][0]["url"])
    
except sunra_client.SunraClientError as e:
    print(f"Error: {e}")
    
    # Access detailed error information
    print(f"Error Code: {e.code}")           # e.g., "invalid_input"
    print(f"Error Message: {e.message}")     # e.g., "Validation error: seed must be >= 0"
    print(f"Error Details: {e.details}")     # Additional error details
    print(f"Timestamp: {e.timestamp}")       # When the error occurred
```

### Error Types

The client handles different types of errors:

**Validation Errors** (from model processing):
```python
try:
    response = sunra_client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "test", "seed": -1}  # Invalid seed
    )
except sunra_client.SunraClientError as e:
    # e.code: "invalid_input"
    # e.message: "Validation error: seed must be >= 0"
    pass
```

**HTTP Errors** (from API requests):
```python
try:
    response = sunra_client.subscribe(
        "non-existent-model/endpoint",
        arguments={"prompt": "test"}
    )
except sunra_client.SunraClientError as e:
    # e.code: "Bad Request"
    # e.message: "Model endpoint is required"
    # e.timestamp: "2025-01-16T12:00:00.000Z"
    pass
```

**Conditional Error Handling**:
```python
try:
    response = sunra_client.subscribe("model/endpoint", arguments={})
except sunra_client.SunraClientError as e:
    if e.code == "invalid_input":
        print("Please check your input parameters")
    elif e.code == "Bad Request":
        print("Invalid API request")
    else:
        print(f"Unexpected error: {e}")
```

## Credits

This project is derived from:

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original projects are licensed under the MIT/Apache 2.0 License. We extend our gratitude to the original authors for their contributions.

# sunra.ai Python Client

This is a Python client library for interacting with ML models deployed on [sunra.ai](https://sunra.ai).

## Community

Join our [Discord community](https://discord.gg/W9F3tveq) to connect with other developers, get help, and stay updated with the latest features and announcements.

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
import io

# It is recommended to configure the client once,
# possibly in a central part of your application.
# This way you won't have to pass the key every time.
sunra_client.config(credentials="your-api-key")


# Upload a file from a local path
# The content type will be inferred from the file extension
file_url = sunra_client.upload_file("path/to/your/image.jpg")

# Upload raw binary data, e.g. from an in-memory image
with open("path/to/your/image.png", "rb") as f:
    image_data = f.read()

data_url = sunra_client.upload(
    data=image_data,
    content_type="image/png",
)

# You can then use the returned URL as input to a model
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "image": file_url,
        "prompt": "a cat",
    },
)

```

**File Upload Limits:**
- Maximum file size: **100MB**
- Supported formats: Images, videos, audio, documents, and other file types as supported by the specific model

## Automatic Input Transformation

The Python SDK automatically transforms file inputs when you call `submit()` or `subscribe()`. This means you can pass various file types directly in your input arguments, and they will be automatically uploaded and replaced with URLs.

### Supported Input Types

The SDK automatically handles:

- **PIL Image objects** - Automatically uploaded as images
- **Base64 data URIs** - Decoded and uploaded with appropriate content type  
- **File paths** - Local files uploaded to CDN
- **File-like objects** - Objects with `read()` method (e.g., `io.BytesIO`, open file handles)

### Automatic Transformation Example

```python
import sunra_client
from PIL import Image
import io

# It is recommended to configure the client once.
sunra_client.config(credentials="your-api-key")

# Create a sample PIL image
image = Image.new("RGB", (1024, 1024), color="purple")

# You can pass the image directly - it will be automatically uploaded
# and the input will be updated with the returned URL.
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "A purple square",
        "image": image,  # The SDK will upload this PIL Image
    }
)
```

### Manual Input Transformation

You can also manually transform inputs if needed:

```python
# For async client
async_client = sunra_client.AsyncClient()
transformed = await async_client.transform_input({
    "image": pil_image,
    "files": ["file1.txt", "file2.jpg"],
    "data": data_uri,
    "metadata": {"nested": {"file": "path/to/file.pdf"}}
})

# For sync client
sync_client = sunra_client.SyncClient()
transformed = sync_client.transform_input({
    "image": pil_image,
    "document": "path/to/document.pdf"
})
```

### Nested Object Support

The transformation works recursively on nested objects and arrays:

```python
input_data = {
    "prompt": "Process these images",
    "images": [image1, image2, image3],  # All PIL images will be uploaded
    "settings": {
        "reference": "path/to/reference.jpg",  # Nested file path will be uploaded
        "masks": [mask1_data_uri, mask2_data_uri]  # Nested data URIs will be uploaded
    }
}

# All file inputs will be automatically transformed when submitted.

Example with an actual model:

```python
import sunra_client
from PIL import Image

sunra_client.config(credentials="your-api-key")

# Create a sample PIL image
image = Image.new("RGB", (512, 512), color = 'red')

# All file-like inputs will be automatically transformed when submitted
response = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "A red square",
        "image": image,
    }
)

print(response)
```

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

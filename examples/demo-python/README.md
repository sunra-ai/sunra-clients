# Python Demo Examples

This directory contains various examples demonstrating how to use the sunra-client Python library.

## Setup

Before running any examples, make sure you have:

1. Installed the sunra-client library:
   ```bash
   pip install sunra-client
   ```

2. Get your API key:
   - Sign up at [sunra.ai](https://sunra.ai)
   - Get your API key from the [dashboard](https://sunra.ai/dashboard/keys)

3. Set your API key as an environment variable:
   ```bash
   export SUNRA_KEY=your-api-key-here
   ```

## Examples

### Basic Examples

- **`text-to-image.py`** - Basic text-to-image generation
- **`image-to-image.py`** - Image-to-image transformation
- **`text-to-video.py`** - Text-to-video generation
- **`image-to-video.py`** - Image-to-video transformation
- **`speech-to-text.py`** - Speech-to-text conversion

### Transform Input Examples

The following examples demonstrate the automatic file upload and transformation functionality:

- **`transform-input-example.py`** - Comprehensive demo of automatic file/image transformation
- **`transform-base64-input.py`** - Real working example using base64 data URIs that get automatically uploaded

#### Transform Input Features

The Python SDK automatically uploads and transforms various input types when you call `submit()` or `subscribe()`:

- **PIL Image objects** → Uploaded to CDN, replaced with URLs
- **Base64 data URIs** → Decoded, uploaded, replaced with URLs  
- **File paths** → File contents uploaded, replaced with URLs
- **File-like objects** → Contents uploaded, replaced with URLs
- **Nested structures** → Recursively processes lists and dictionaries

#### Usage Example

```python
import sunra_client
from PIL import Image

# Create or load an image
image = Image.open("photo.jpg")

# Base64 data URI
base64_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."

# Just pass them directly - automatic upload and transformation!
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "Make it artistic",
        "image": image,  # ← PIL Image automatically uploaded!
        "reference": base64_image,  # ← Data URI automatically uploaded!
    }
)
```

**No manual upload steps required!** The SDK handles everything automatically.

### Configuration Examples

The following examples demonstrate the new `config()` function for setting API credentials:

- **`config-example.py`** - Shows how to use `sunra_client.config()` to set credentials
- **`config-switching-example.py`** - Demonstrates switching between different API keys
- **`config-comparison.py`** - Compares different methods of setting credentials

### Configuration Methods

The sunra-client supports three ways to configure your API credentials:

#### 1. Environment Variables (Default)
```bash
export SUNRA_KEY=your-api-key
```
```python
import sunra_client
# Client automatically uses SUNRA_KEY from environment
client = sunra_client.SyncClient()
```

#### 2. Global Configuration (New)
```python
import sunra_client
# Set credentials globally
sunra_client.config(credentials="your-api-key")
# All clients will use these credentials
client = sunra_client.SyncClient()
```

#### 3. Explicit Client Configuration
```python
import sunra_client
# Pass credentials directly to client
client = sunra_client.SyncClient(key="your-api-key")
```

### Priority Order

When multiple configuration methods are used, the priority is:
1. **Explicit client key** (highest priority)
2. **Global config** (via `sunra_client.config()`)
3. **Environment variable** (lowest priority)

### Running the Examples

To run any example:

```bash
python text-to-image.py
python config-example.py
python config-comparison.py
```

### Use Cases for config()

The `config()` function is particularly useful for:

- **Dynamic credential management** - Switch between different API keys programmatically
- **Library development** - When building libraries that wrap the sunra client
- **Testing environments** - Easily switch between development and production keys
- **Containerized applications** - Avoid environment variable dependencies
- **Web applications** - Set credentials based on user context or configuration files

## Notes

- All examples read the API key from the `SUNRA_KEY` environment variable
- The config examples demonstrate the flexibility of the new configuration system
- The actual API requests are identical regardless of how credentials are configured 

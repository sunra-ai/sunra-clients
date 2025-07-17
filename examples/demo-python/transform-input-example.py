"""
Example demonstrating the transform_input functionality in the Python SDK.

This example shows how the Python SDK automatically uploads and transforms:
- PIL Image objects
- Base64 data URIs
- File paths
- File-like objects

The transformed inputs will have uploaded URLs instead of the original file data.
"""

import asyncio
import base64
import io
import os
import tempfile
import requests
from sunra_client import AsyncClient, SyncClient

def create_sample_image_data_uri():
    """Create a simple base64 data URI for testing."""
    # Create a simple 1x1 pixel PNG
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    base64_data = base64.b64encode(png_data).decode('utf-8')
    return f"data:image/png;base64,{base64_data}"

def download_real_image_as_data_uri():
    """Download a real image and convert to base64 data URI."""
    try:
        print("📥 Downloading real image for demonstration...")
        # Use a small, publicly available image for testing
        image_url = "https://assets.sunra.ai/uploads/1749213107107-3cd65bbe.jpeg"

        response = requests.get(image_url)
        response.raise_for_status()

        # Get content type
        content_type = response.headers.get('content-type', 'image/jpeg')

        # Convert to base64 data URI
        base64_data = base64.b64encode(response.content).decode('utf-8')
        data_uri = f"data:{content_type};base64,{base64_data}"

        print(f"✅ Downloaded image ({len(response.content)} bytes)")
        print(f"📝 Data URI length: {len(data_uri)} characters")

        return data_uri
    except Exception as e:
        print(f"⚠️  Failed to download real image: {e}")
        print("🔄 Falling back to synthetic image...")
        return create_sample_image_data_uri()

def create_sample_file():
    """Create a temporary file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("This is a test file for transform_input functionality.")
        return f.name

def create_file_like_object():
    """Create a file-like object for testing."""
    content = b"This is a file-like object content."
    file_obj = io.BytesIO(content)
    file_obj.name = "test.txt"
    file_obj.content_type = "text/plain"
    return file_obj

async def async_example():
    """Demonstrate async transform_input functionality."""
    client = AsyncClient()

    # Create test data including a real downloaded image
    data_uri = download_real_image_as_data_uri()
    temp_file = create_sample_file()
    file_obj = create_file_like_object()

    try:
        # Complex nested input with various file types
        input_data = {
            "prompt": "Transform this image",
            "image": data_uri,  # This will be uploaded and replaced with URL
            "reference_file": temp_file,  # This will be uploaded and replaced with URL
            "data": file_obj,  # This will be uploaded and replaced with URL
            "metadata": {
                "settings": {
                    "quality": "high",
                    "format": "png"
                },
                "files": [temp_file, data_uri]  # List items will also be transformed
            },
            "keep_this": "This string will remain unchanged"
        }

        print("\n🔍 BEFORE transformation:")
        print(f"  image type: {type(input_data['image'])}")
        print(f"  image preview: {str(input_data['image'])[:100]}...")
        print(f"  reference_file type: {type(input_data['reference_file'])}")
        print(f"  reference_file value: {input_data['reference_file']}")
        print(f"  data type: {type(input_data['data'])}")

        # Transform the input
        print("\n🔄 Calling transform_input...")
        transformed = await client.transform_input(input_data)

        print("\n🎯 AFTER transformation:")
        print(f"  image (should be URL): {transformed['image']}")
        print(f"  reference_file (should be URL): {transformed['reference_file']}")
        print(f"  data (should be URL): {transformed['data']}")
        print(f"  unchanged text: {transformed['keep_this']}")
        print(f"  files in metadata: {transformed['metadata']['files']}")

        # Verify transformations worked
        print("\n✅ Verification:")
        image_transformed = transformed["image"].startswith("https://")
        file_transformed = transformed["reference_file"].startswith("https://")
        data_transformed = transformed["data"].startswith("https://")

        print(f"  Image transformed to URL: {image_transformed}")
        print(f"  File transformed to URL: {file_transformed}")
        print(f"  Data transformed to URL: {data_transformed}")

        if all([image_transformed, file_transformed, data_transformed]):
            print("🎉 All transformations successful!")
        else:
            print("⚠️  Some transformations may not have worked as expected")

    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.unlink(temp_file)

def sync_example():
    """Demonstrate sync transform_input functionality."""
    client = SyncClient()

    # Create test data
    data_uri = create_sample_image_data_uri()
    temp_file = create_sample_file()

    try:
        # Simple input transformation
        input_data = {
            "image": data_uri,
            "text": "Process this image"
        }

        print("\n🔄 Sync transform_input example:")
        print(f"  Original image type: {type(input_data['image'])}")
        print(f"  Original image preview: {input_data['image'][:80]}...")

        # Transform the input
        transformed = client.transform_input(input_data)

        print(f"  Transformed image: {transformed['image']}")
        print(f"  Unchanged text: {transformed['text']}")

        # Verify transformation
        if transformed['image'].startswith('https://'):
            print("✅ Sync transformation successful!")
        else:
            print("⚠️  Sync transformation may not have worked as expected")

    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.unlink(temp_file)

async def demonstrate_automatic_transformation():
    """Show how submit() automatically transforms inputs."""
    client = AsyncClient()

    # Use a real downloaded image for more realistic demonstration
    data_uri = download_real_image_as_data_uri()

    # When you call submit(), transform_input is automatically called
    # So you can pass file objects, images, etc. directly in arguments
    input_data = {
        "prompt": "A cute cat",
        "reference_image": data_uri  # This will be automatically uploaded
    }

    print("\n🤖 Automatic transformation example:")
    print("  Input contains base64 data URI")
    print("  When submit() is called, transform_input runs automatically")
    print("  Base64 data will be uploaded and replaced with URL")

    # Note: This would actually submit to the queue, so we're just showing the pattern
    # In real usage: handle = await client.submit("some-model-endpoint", input_data)
    print("  📡 Example: handle = await client.submit('model', input_data)")
    print("  ✅ submit() automatically calls transform_input behind the scenes!")

def demonstrate_real_world_usage():
    """Show a complete real-world example."""
    print("\n🌍 Real-world usage example:")
    print("=" * 50)

    try:
        # This shows how you would typically use it in practice
        data_uri = download_real_image_as_data_uri()

        print("\nIn your application, you can now directly use files/images:")
        print("""
        import sunra_client

        # Your base64 image data (from upload, canvas, etc.)
        base64_image = "data:image/jpeg;base64,/9j/4AAQ..."

        # Just pass it directly - transform_input handles the upload automatically!
        result = sunra_client.subscribe(
            "black-forest-labs/flux-kontext-pro/image-to-image",
            arguments={
                "prompt": "Make it artistic",
                "image": base64_image,  # ← Automatically uploaded!
            }
        )
        """)

        print("🎯 Key benefits:")
        print("  • No manual upload steps required")
        print("  • Works with PIL Images, file paths, data URIs, file objects")
        print("  • Automatically handles nested data structures")
        print("  • Transparent - your code stays simple")

    except Exception as e:
        print(f"Demo setup error: {e}")

if __name__ == "__main__":
    print("🎨 Transform Input Comprehensive Demo")
    print("=" * 50)

    # Run async example
    print("\n1️⃣ Async transform_input example:")
    asyncio.run(async_example())

    # Run sync example
    print("\n2️⃣ Sync transform_input example:")
    sync_example()

    # Show automatic transformation
    print("\n3️⃣ Automatic transformation in submit():")
    asyncio.run(demonstrate_automatic_transformation())

    # Show real-world usage
    print("\n4️⃣ Real-world usage pattern:")
    demonstrate_real_world_usage()

    print("\n" + "=" * 50)
    print("✅ Transform input demo completed!")
    print("\nKey takeaways:")
    print("- PIL Images are automatically uploaded and replaced with URLs")
    print("- Base64 data URIs are decoded, uploaded, and replaced with URLs")
    print("- File paths are uploaded and replaced with URLs")
    print("- File-like objects are uploaded and replaced with URLs")
    print("- Nested objects and arrays are recursively processed")
    print("- Other data types remain unchanged")
    print("- submit() and subscribe() automatically call transform_input")
    print("- This makes working with files/images much simpler!")

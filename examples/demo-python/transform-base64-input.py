"""
Real working example demonstrating transform_input with base64 data URIs.

This example:
1. Downloads an image from a URL
2. Converts it to a base64 data URI
3. Uses the data URI in an API call
4. Shows how transform_input automatically uploads it and replaces it with a URL

Based on the image-to-image.py example but with base64 input to demonstrate transform_input.
"""

import base64
import requests
import sunra_client

def download_and_encode_image(image_url: str) -> str:
    """Download image from URL and convert to base64 data URI."""
    print(f"📥 Downloading image from: {image_url}")

    # Download the image
    response = requests.get(image_url)
    response.raise_for_status()

    # Get content type from response headers
    content_type = response.headers.get('content-type', 'image/jpeg')
    print(f"📄 Content type: {content_type}")

    # Convert to base64 data URI
    base64_data = base64.b64encode(response.content).decode('utf-8')
    data_uri = f"data:{content_type};base64,{base64_data}"

    print(f"✅ Converted to base64 data URI (length: {len(data_uri)} chars)")
    print(f"📝 Data URI preview: {data_uri[:80]}...")

    return data_uri

def main():
    """Main example function."""
    print("🎨 Image-to-Image with Base64 Data URI Example")
    print("=" * 50)

    # get your API key from https://sunra.ai/dashboard/api-tokens
    # sunra_client reads the credentials from the environment variable SUNRA_KEY by default

    # Use the same image URL from the original image-to-image.py example
    image_url = "https://assets.sunra.ai/uploads/1749213107107-3cd65bbe.jpeg"

    try:
        # Step 1: Download and convert image to base64 data URI
        base64_image = download_and_encode_image(image_url)

        print("\n🔄 Making API request with base64 data URI...")
        print("Note: transform_input will automatically:")
        print("  1. Detect the base64 data URI")
        print("  2. Decode the base64 data")
        print("  3. Upload it to Sunra's CDN")
        print("  4. Replace the data URI with the uploaded URL")

        # Step 2: Use the base64 data URI in the API call
        # The transform_input function will automatically handle the upload
        result = sunra_client.subscribe(
            "black-forest-labs/flux-kontext-pro/image-to-image",
            arguments={
                "prompt": "Make black-and-white Japanese manga style.",
                "prompt_enhancer": False,
                "aspect_ratio": "16:9",
                "output_format": "jpeg",
                "image": base64_image,  # This base64 data URI will be automatically uploaded!
                "safety_tolerance": 40
            },
            with_logs=True,
            on_enqueue=lambda request_id: print(f"🎯 Request enqueued: {request_id}"),
            on_queue_update=lambda status: print(f"📊 Status update: {status}"),
        )

        print("\n🎉 Success! Result:")
        print(result)

        print("\n✅ Key Points Demonstrated:")
        print("  • Base64 data URI was automatically detected")
        print("  • Image data was decoded and uploaded to CDN")
        print("  • API received the uploaded URL instead of base64 data")
        print("  • No manual upload steps were required!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("  • Make sure SUNRA_KEY environment variable is set")
        print("  • Check your API key at https://sunra.ai/dashboard/api-tokens")
        print("  • Ensure you have credits available")

if __name__ == "__main__":
    main()

# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

def test_validation_error():
    """Test handling of validation errors from the API"""
    print("=== Testing Validation Error ===")
    try:
        result = sunra_client.subscribe(
            # find more models here: https://sunra.ai/models
            "black-forest-labs/flux-kontext-pro/text-to-image",
            arguments={
                "prompt": "a bedroom with messy goods on the bed and floor",
                "prompt_enhancer": False,
                "seed": -2,  # Invalid seed (should be >= 0)
                "aspect_ratio": "16:9",
                "output_format": "jpeg",
                "safety_tolerance": 6
            },
            with_logs=True,
            on_enqueue=print,
            on_queue_update=print,
        )
        print(result)

    except sunra_client.SunraClientError as e:
        print(f"Caught SunraClientError: {e}")
        print(f"  code: {e.code}")
        print(f"  message: {e.message}")
        print(f"  details: {e.details}")
        print(f"  timestamp: {e.timestamp}")

def test_http_error():
    """Test handling of HTTP errors (like 404, 401, etc.)"""
    print("\n=== Testing HTTP Error ===")
    try:
        # Try to access a non-existent endpoint to trigger HTTP error
        result = sunra_client.subscribe(
            "non-existent-model/endpoint",
            arguments={"prompt": "test"},
            with_logs=True,
        )
        print(result)

    except sunra_client.SunraClientError as e:
        print(f"Caught SunraClientError: {e}")
        print(f"  code: {e.code}")
        print(f"  message: {e.message}")
        print(f"  details: {e.details}")
        print(f"  timestamp: {e.timestamp}")

if __name__ == "__main__":
    test_validation_error()
    test_http_error()

import os
import sunra_client

# Example: Comparison between environment variables and config() function
# This shows both methods work the same way

api_key = os.environ.get('SUNRA_KEY')
if not api_key:
    print("Error: SUNRA_KEY environment variable not set")
    exit(1)

print("=== Comparison of Configuration Methods ===")

# Method 1: Using environment variables (default behavior)
print("\n1. Using environment variables (default behavior):")
print("   - SUNRA_KEY is set in environment")
print("   - Client automatically uses environment variable")
client_env = sunra_client.SyncClient()
print("   ✓ SyncClient created (uses SUNRA_KEY from environment)")

# Method 2: Using config() function
print("\n2. Using config() function (new method):")
print("   - Explicitly set credentials using sunra_client.config()")
sunra_client.config(credentials=api_key)
print("   ✓ Global credentials configured")
client_config = sunra_client.SyncClient()
print("   ✓ SyncClient created (uses global config)")

# Method 3: Explicit client configuration
print("\n3. Using explicit client configuration:")
print("   - Pass credentials directly to client constructor")
client_explicit = sunra_client.SyncClient(key=api_key)
print("   ✓ SyncClient created with explicit key")

print("\n=== All methods work identically ===")
print("The config() function provides flexibility for scenarios where:")
print("- You want to set credentials programmatically")
print("- You need to switch between different API keys")
print("- You're building libraries that wrap the sunra client")
print("- You want to avoid environment variable dependencies")

print("\nMaking a test request using the config() method...")

# Test the config method with a simple request
try:
    result = sunra_client.subscribe(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "a simple geometric pattern with blue and white colors",
            "prompt_enhancer": False,
            "seed": 1,
            "aspect_ratio": "1:1",
            "output_format": "jpeg",
            "safety_tolerance": 6
        },
        with_logs=False,
        on_enqueue=lambda req_id: print(f"✓ Request enqueued: {req_id}"),
        on_queue_update=lambda status: print(f"  Status: {type(status).__name__}"),
    )
    print(f"✓ Request completed successfully")
    print(f"  Generated {len(result.get('images', []))} image(s)")
except Exception as e:
    print(f"✗ Request failed: {e}")

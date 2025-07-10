import os
import sunra_client

# Example: Switching between different API keys using config()
# This demonstrates the flexibility of the config function

# Read the primary API key from environment variable
primary_api_key = os.environ.get('SUNRA_KEY')
if not primary_api_key:
    print("Error: SUNRA_KEY environment variable not set")
    exit(1)

# You could also read a secondary key from a different env var
# secondary_api_key = os.environ.get('SUNRA_KEY_SECONDARY', primary_api_key)

print("=== Demonstration of API Key Configuration ===")
print(f"Primary API Key: {primary_api_key[:8]}...")

# Configure with primary API key
sunra_client.config(credentials=primary_api_key)
print("✓ Configured with primary API key")

# Create a client - it will use the configured credentials
client = sunra_client.SyncClient()
print("✓ Created SyncClient (using global config)")

# You can also create a client with explicit credentials that override the global config
explicit_client = sunra_client.SyncClient(key=primary_api_key)
print("✓ Created SyncClient with explicit key (overrides global config)")

# Example: Change the global config to a different key
# (In this demo, we'll use the same key, but in practice you could use a different one)
print("\n=== Switching API Key Configuration ===")
sunra_client.config(credentials=primary_api_key)  # Could be a different key
print("✓ Reconfigured with new credentials")

# Now make a request using the global configuration
print("\n=== Making API Request ===")
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={
        "prompt": "a modern workspace with multiple monitors and plants",
        "prompt_enhancer": False,
        "seed": 123,
        "aspect_ratio": "16:9",
        "output_format": "jpeg",
        "safety_tolerance": 6
    },
    with_logs=True,
    on_enqueue=lambda req_id: print(f"Request enqueued: {req_id}"),
    on_queue_update=lambda status: print(f"Status update: {status}"),
)

print("\n=== Request Completed ===")
print(f"Generated {len(result.get('images', []))} image(s)")
if result.get('images'):
    print(f"First image URL: {result['images'][0]['url']}")

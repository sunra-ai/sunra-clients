import os
import sunra_client

# Example: Using config() to set credentials
# This demonstrates the ability to change the API token programmatically

# Read the API key from environment variable
api_key = os.environ.get('SUNRA_KEY')
if not api_key:
    print("Error: SUNRA_KEY environment variable not set")
    exit(1)

# Use the config function to set credentials
# This is equivalent to the default behavior but shows we can change it
sunra_client.config(credentials=api_key)

print("API key configured successfully using sunra_client.config()")
print("Running text-to-image generation...")

# Now use the client - it will use the credentials we set via config()
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={
        "prompt": "a cozy coffee shop with warm lighting and vintage decor",
        "prompt_enhancer": False,
        "seed": 42,
        "aspect_ratio": "16:9",
        "output_format": "jpeg",
        "safety_tolerance": 6
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print,
)

print("Generation completed!")
print(result)

# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

# find more models here: https://sunra.ai/models
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/image-to-image",
    arguments={
        "prompt": "Make black-and-white Japanese manga style.",
        "prompt_enhancer": False,
        "aspect_ratio": "16:9",
        "output_format": "jpeg",
        "image": "https://assets.sunra.ai/uploads/1749213107107-3cd65bbe.jpeg",
        "safety_tolerance": 40
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print,
)
print(result)

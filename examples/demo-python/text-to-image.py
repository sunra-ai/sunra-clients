# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

# find more models here: https://sunra.ai/models
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={
        "prompt": "a bedroom with messy goods on the bed and floor",
        "prompt_enhancer": False,
        "seed": 0,
        "aspect_ratio": "16:9",
        "output_format": "jpeg",
        "safety_tolerance": 6
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print,
)
print(result)

# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

# find more models here: https://sunra.ai/models
result = sunra_client.subscribe(
    "openai/gpt-image-2/text-to-image",
    arguments={
        "prompt": "a bedroom with messy goods on the bed and floor",
        "quality": "high",
        "output_format": "jpeg",
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print,
)
print(result)

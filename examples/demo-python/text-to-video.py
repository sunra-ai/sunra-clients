# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

# find more models here: https://sunra.ai/models
result = sunra_client.subscribe(
    "kling/kling-v2-master/text-to-video",
    arguments={
        "prompt": "A pole bear playing violin in the snow.",
        "negative_prompt": "",
        "guidance_scale": 0.5,
        "aspect_ratio": "16:9",
        "duration": 5
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print,
)
print(result)

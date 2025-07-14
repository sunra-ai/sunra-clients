# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

# find more models here: https://sunra.ai/models
result = sunra_client.subscribe(
    "kling/kling-v2-master/image-to-video",
    arguments={
        "prompt": "A cute hamster lies leisurely on a lifebuoy, wearing fashionable sunglasses, and drifts with the gentle waves on the shimmering sea surface. The hamster reclines comfortably, enjoying a peaceful and pleasant time. Cartoon style, the camera follows the subject moving, with a heartwarming and high picture quality.",
        "negative_prompt": "",
        "guidance_scale": 0.5,
        "aspect_ratio": "16:9",
        "duration": 5,
        "start_image": "https://assets.sunra.ai/uploads/1748811753168-05ceab0d.png"
    },
    with_logs=True,
    on_enqueue=print,
    on_queue_update=print,
)
print(result)

import sunra_client

def on_queue_update(update):
    if isinstance(update, sunra_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = sunra_client.subscribe(
    "elevenlabs/scribe-v1/speech-to-text",
    arguments={
        "audio": "https://assets.sunra.ai/uploads/1749243418768-74d68e25.wav",
        "language": "English",
        "tag_audio_events": True,
        "speaker_diarization": False
    },
    on_queue_update=on_queue_update,
)
print(result)
import sunra_client

result = sunra_client.subscribe(
    "elevenlabs/scribe-v1/speech-to-text",
    arguments={
        "audio": "https://assets.sunra.ai/uploads/1749243418768-74d68e25.wav",
        "language": "English",
        "tag_audio_events": True,
        "speaker_diarization": False
    },
    with_logs=True,
    on_queue_update=print
)
print(result)
#!/usr/bin/env python3
"""
Demo script for LLM endpoint using OpenAI SDK directly.
This demonstrates how to use Sunra's LLM API with the standard OpenAI client.
"""

import os
from openai import OpenAI

def main():
    # Get API key from environment variable
    api_key = os.getenv('SUNRA_KEY')
    if not api_key:
        print("Error: SUNRA_KEY environment variable is not set")
        print("Get your API key from https://sunra.ai/dashboard/api-tokens")
        return

    # Initialize OpenAI client with Sunra endpoint
    client = OpenAI(
        api_key=api_key,
        base_url="https://api-llm.sunra.ai/v1"
    )

    try:
        print("Sending streaming chat completion request...")

        # Make a streaming chat completion request
        stream = client.chat.completions.create(
            model="google-deepmind/gemini-2.5-flash-lite",  # You can use any llm model available on Sunra
            messages=[
                {
                  "role": "system",
                  "content": "You are an expert in AIGC, you can help me optimize the prompt for better results, especially for text to image models. I will give you a prompt, you can help me optimize it."
                },
                {
                  "role": "user",
                  "content": "the original prompt is: 'A scene from a high-quality animated film, like a work by Makoto Shinkai. In a deep midsummer forest, a train speeds down tracks showered in sunlight filtering through the trees (komorebi). The camera weaves through the trees, chasing the train to emphasize the sense of speed. A girl with her head out the window is bathed in the rapidly changing light and shadow, her hair fluttering in a wind that carries the scent of green. The trees in the background become a green afterimage, vividly highlighting her expression, full of liberation, from moment to moment. '"
                }
            ],
            stream=True
        )

        print("\n" + "="*50)
        print("Streaming Response:")
        print("="*50)

        full_response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                print(content, end="", flush=True)
                full_response += content

        print("\n" + "="*50)
        print(f"Full Response: {full_response}")
        print("="*50)

    except Exception as error:
        print(f"Error: {error}")
        return

if __name__ == "__main__":
    main()

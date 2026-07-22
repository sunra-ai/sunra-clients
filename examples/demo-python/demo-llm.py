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

        # Omit extra_body to use automatic provider routing.
        stream = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {
                  "role": "system",
                  "content": "You are a helpful assistant."
                },
                {
                  "role": "user",
                  "content": "Explain provider routing in two short sentences."
                }
            ],
            stream=True,
            extra_body={"provider": {"only": ["google-vertexai"]}}
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

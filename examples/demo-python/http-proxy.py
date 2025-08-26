#!/usr/bin/env python3
"""
HTTP Proxy Demo for Sunra Python Client

This demo shows how to use a custom HTTP client with proxy support
similar to the JavaScript http-proxy.ts example.
"""

import os
import httpx
from sunra_client import AsyncClient, SyncClient, SunraClientError


def main():
    # Get API key from environment
    api_key = os.getenv('SUNRA_KEY')
    if not api_key:
        print('\033[91mSUNRA_KEY is not set\033[0m')
        exit(1)

    # Example 1: Using sync client with proxy
    print('\033[92mExample 1: Sync client with HTTP proxy\033[0m')

    # Create a custom httpx client with proxy settings
    # Note: httpx uses the HTTPS_PROXY environment variable automatically
    # You can also explicitly pass proxy URL as a string
    proxy_url = os.getenv('HTTPS_PROXY', 'http://127.0.0.1:7890')
    proxy_client = httpx.Client(
        proxy=proxy_url,
        timeout=30.0,
        headers={
            'User-Agent': 'my-awesome-python-client'
        }
    )

    # Create Sunra client with custom HTTP client
    sunra_sync = SyncClient(
        key=api_key,
        http_client=proxy_client
    )

    try:
        print('\033[92mSubscribing to the queue (sync)...\033[0m')

        # find more models here: https://sunra.ai/models
        result = sunra_sync.subscribe(
            'black-forest-labs/flux-kontext-pro/text-to-image',
            {
                'prompt': 'a bedroom with messy goods on the bed and floor',
                'prompt_enhancer': False,
                'seed': 0,
                'aspect_ratio': '16:9',
                'output_format': 'jpeg',
                'safety_tolerance': 6
            },
            on_enqueue=lambda request_id: print(f'\033[92mEnqueued:\033[0m {request_id}'),
            on_queue_update=lambda status: print(f'\033[92mQueue update:\033[0m {status}'),
        )
        print('Sync result:', result)

    except SunraClientError as error:
        print(f'\033[91mSunra Error:\033[0m {error}')
    except httpx.HTTPError as error:
        print(f'\033[91mHTTP Error:\033[0m {error}')
    except Exception as error:
        print(f'\033[91mUnexpected Error:\033[0m {error}')


async def async_example():
    # Get API key from environment
    api_key = os.getenv('SUNRA_KEY')
    if not api_key:
        print('\033[91mSUNRA_KEY is not set\033[0m')
        return

    # Example 2: Using async client with proxy
    print('\n\033[92mExample 2: Async client with HTTP proxy\033[0m')

    # Create a custom httpx async client with proxy settings
    # Note: httpx uses the HTTPS_PROXY environment variable automatically
    # You can also explicitly pass proxy URL as a string
    proxy_url = os.getenv('HTTPS_PROXY', 'http://127.0.0.1:7890')
    async_proxy_client = httpx.AsyncClient(
        proxy=proxy_url,
        timeout=30.0,
        headers={
            'User-Agent': 'my-awesome-async-python-client'
        }
    )

    # Create Sunra async client with custom HTTP client
    sunra_async = AsyncClient(
        key=api_key,
        http_client=async_proxy_client
    )

    try:
        print('\033[92mSubscribing to the queue (async)...\033[0m')

        # find more models here: https://sunra.ai/models
        result = await sunra_async.subscribe(
            'black-forest-labs/flux-kontext-pro/text-to-image',
            {
                'prompt': 'a cozy living room with warm lighting',
                'prompt_enhancer': False,
                'seed': 42,
                'aspect_ratio': '1:1',
                'output_format': 'png',
                'safety_tolerance': 6
            },
            on_enqueue=lambda request_id: print(f'\033[92mEnqueued (async):\033[0m {request_id}'),
            on_queue_update=lambda status: print(f'\033[92mQueue update (async):\033[0m {status}'),
        )
        print('Async result:', result)

    except SunraClientError as error:
        print(f'\033[91mSunra Error:\033[0m {error}')
    except httpx.HTTPError as error:
        print(f'\033[91mHTTP Error:\033[0m {error}')
    except Exception as error:
        print(f'\033[91mUnexpected Error:\033[0m {error}')

    finally:
        # Close the async client
        await async_proxy_client.aclose()


if __name__ == '__main__':
    import asyncio

    # Run sync example
    main()

    # Run async example
    asyncio.run(async_example())

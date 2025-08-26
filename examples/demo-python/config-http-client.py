#!/usr/bin/env python3
"""
Global Configuration with HTTP Client Demo for Sunra Python Client

This demo shows how to use the config function to set up HTTP clients globally,
similar to how credentials can be configured.
"""

import os
import httpx
import sunra_client


def main():
    # Get API key from environment
    api_key = os.getenv('SUNRA_KEY')
    if not api_key:
        print('\033[91mSUNRA_KEY is not set\033[0m')
        exit(1)

    print('\033[92mExample: Global configuration with HTTP clients\033[0m')

    # Create custom HTTP clients with proxy settings
    proxy_url = os.getenv('HTTPS_PROXY', 'http://127.0.0.1:7890')

    sync_proxy_client = httpx.Client(
        proxy=proxy_url,
        timeout=30.0,
        headers={'User-Agent': 'global-sync-client'}
    )

    async_proxy_client = httpx.AsyncClient(
        proxy=proxy_url,
        timeout=30.0,
        headers={'User-Agent': 'global-async-client'}
    )

    # Configure globally - this affects all subsequent calls
    sunra_client.config(
        credentials=api_key,
        http_client=sync_proxy_client,
        async_http_client=async_proxy_client
    )

    print('\033[92mGlobal configuration set successfully!\033[0m')

    # Example 1: Using sync functions with global config
    print('\n\033[92mExample 1: Using sync functions with global HTTP client\033[0m')

    try:
        # This will use the globally configured sync HTTP client
        result = sunra_client.subscribe(
            'black-forest-labs/flux-kontext-pro/text-to-image',
            {
                'prompt': 'a modern office space with computers',
                'prompt_enhancer': False,
                'seed': 123,
                'aspect_ratio': '16:9',
                'output_format': 'jpeg',
                'safety_tolerance': 6
            },
            on_enqueue=lambda request_id: print(f'\033[92mSync Enqueued:\033[0m {request_id}'),
            on_queue_update=lambda status: print(f'\033[92mSync Queue update:\033[0m {status}'),
        )
        print('Sync result with global config:', result)

    except sunra_client.SunraClientError as error:
        print(f'\033[91mSunra Error:\033[0m {error}')
    except httpx.HTTPError as error:
        print(f'\033[91mHTTP Error:\033[0m {error}')
    except Exception as error:
        print(f'\033[91mUnexpected Error:\033[0m {error}')

    # Example 2: Using async functions with global config
    print('\n\033[92mExample 2: Using async functions with global HTTP client\033[0m')

    import asyncio

    async def async_example():
        try:
            # This will use the globally configured async HTTP client
            result = await sunra_client.subscribe_async(
                'black-forest-labs/flux-kontext-pro/text-to-image',
                {
                    'prompt': 'a peaceful garden with flowers',
                    'prompt_enhancer': False,
                    'seed': 456,
                    'aspect_ratio': '1:1',
                    'output_format': 'png',
                    'safety_tolerance': 6
                },
                on_enqueue=lambda request_id: print(f'\033[92mAsync Enqueued:\033[0m {request_id}'),
                on_queue_update=lambda status: print(f'\033[92mAsync Queue update:\033[0m {status}'),
            )
            print('Async result with global config:', result)

        except sunra_client.SunraClientError as error:
            print(f'\033[91mSunra Error:\033[0m {error}')
        except httpx.HTTPError as error:
            print(f'\033[91mHTTP Error:\033[0m {error}')
        except Exception as error:
            print(f'\033[91mUnexpected Error:\033[0m {error}')
        finally:
            # Close the async client when done
            await async_proxy_client.aclose()

    # Run the async example
    asyncio.run(async_example())

    # Example 3: Updating configuration
    print('\n\033[92mExample 3: Updating global configuration\033[0m')

    # You can update just the credentials without affecting HTTP clients
    sunra_client.config(credentials=api_key)
    print('Updated credentials while keeping HTTP clients')

    # Or update just the HTTP clients without affecting credentials
    new_sync_client = httpx.Client(
        timeout=60.0,
        headers={'User-Agent': 'updated-sync-client'}
    )
    sunra_client.config(http_client=new_sync_client)
    print('Updated sync HTTP client while keeping credentials and async client')

    # Example 4: Mixed usage - global config + explicit clients
    print('\n\033[92mExample 4: Mixed usage - explicit client overrides global config\033[0m')

    # Create an explicit client that will override the global one
    explicit_client = sunra_client.SyncClient(
        key=api_key,
        http_client=httpx.Client(
            timeout=10.0,
            headers={'User-Agent': 'explicit-override-client'}
        )
    )

    try:
        # This uses the explicit client, not the global one
        result = explicit_client.subscribe(
            'black-forest-labs/flux-kontext-pro/text-to-image',
            {
                'prompt': 'a beautiful sunset over mountains',
                'prompt_enhancer': False,
                'seed': 789,
                'aspect_ratio': '4:3',
                'output_format': 'jpeg',
                'safety_tolerance': 6
            },
            on_enqueue=lambda request_id: print(f'\033[92mExplicit Enqueued:\033[0m {request_id}'),
            on_queue_update=lambda status: print(f'\033[92mExplicit Queue update:\033[0m {status}'),
        )
        print('Result with explicit client:', result)

    except sunra_client.SunraClientError as error:
        print(f'\033[91mSunra Error:\033[0m {error}')
    except httpx.HTTPError as error:
        print(f'\033[91mHTTP Error:\033[0m {error}')
    except Exception as error:
        print(f'\033[91mUnexpected Error:\033[0m {error}')

    print('\n\033[92mDemo completed successfully!\033[0m')


if __name__ == '__main__':
    main()

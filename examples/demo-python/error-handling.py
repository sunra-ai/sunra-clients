# get your API key from https://sunra.ai/dashboard/api-tokens
# sunra_client reads the credentials from the environment variable SUNRA_KEY by default
import sunra_client

# ============================================================================
# RECOMMENDED APPROACH: Using on_error Callback Style (Non-Raising)
# ============================================================================

def test_validation_error_with_callback():
    """Test handling of validation errors using on_error callback (recommended)"""
    print("=== Validation Error with on_error Callback (Recommended) ===")

    has_error = False
    error_details = None

    def handle_error(error: sunra_client.SunraClientError):
        nonlocal has_error, error_details
        has_error = True
        error_details = error
        print("Error handled gracefully by on_error callback:")
        print(f"  Type: {error.type or 'N/A'}")
        print(f"  Code: {error.code}")
        print(f"  Message: {error.message}")
        print(f"  Details: {error.details or 'N/A'}")
        print(f"  Request ID: {error.request_id or 'N/A'}")
        print(f"  Rate Limit: {error.rate_limit or 'N/A'}")
        print(f"  Timestamp: {error.timestamp or 'N/A'}")

    result = sunra_client.subscribe(
        # find more models here: https://sunra.ai/models
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={
            "prompt": "a bedroom with messy goods on the bed and floor",
            "prompt_enhancer": False,
            "seed": -2,  # Invalid seed (should be >= 0)
            "aspect_ratio": "16:9",
            "output_format": "jpeg",
            "safety_tolerance": 6
        },
        with_logs=True,
        on_enqueue=lambda request_id: print(f"Enqueued: {request_id}"),
        on_queue_update=lambda status: print(f"Queue update: {status}"),
        on_error=handle_error,
    )

    if has_error:
        print("✓ Error handled without raising exception")
        print("  This is the recommended approach for production applications")
    elif result:
        print(f"✓ Request succeeded: {result}")


def test_http_error_with_callback():
    """Test handling of HTTP errors using on_error callback (recommended)"""
    print("\n=== HTTP Error with on_error Callback (Recommended) ===")

    has_error = False

    def handle_error(error: sunra_client.SunraClientError):
        nonlocal has_error
        has_error = True
        print("HTTP error handled gracefully by on_error callback:")
        print(f"  Type: {error.type or 'N/A'}")
        print(f"  Code: {error.code}")
        print(f"  Message: {error.message}")
        print(f"  Details: {error.details or 'N/A'}")
        print(f"  Request ID: {error.request_id or 'N/A'}")
        print(f"  Rate Limit: {error.rate_limit or 'N/A'}")

    result = sunra_client.subscribe(
        "non-existent-model/endpoint",
        arguments={"prompt": "test"},
        with_logs=True,
        on_error=handle_error,
    )

    if has_error:
        print("✓ HTTP error handled without raising exception")
    elif result:
        print(f"✓ Request succeeded: {result}")


def test_rate_limiting_with_callback():
    """Test handling of rate limiting using on_error callback (recommended)"""
    print("\n=== Rate Limiting with on_error Callback (Recommended) ===")

    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    def make_request(index):
        has_error = False

        def handle_error(error: sunra_client.SunraClientError):
            nonlocal has_error
            has_error = True
            print(f"Request {index} error handled by on_error callback:")
            print(f"  Code: {error.code}")
            print(f"  Message: {error.message}")
            if error.rate_limit:
                print(f"  Rate Limit - Reset Time: {error.rate_limit.get('reset_time', 'N/A')}")
                print(f"  Rate Limit - Remaining: {error.rate_limit.get('remaining', 'N/A')}")

        result = sunra_client.subscribe(
            "black-forest-labs/flux-kontext-pro/text-to-image",
            arguments={
                "prompt": f"test image {index}",
                "aspect_ratio": "1:1"
            },
            on_error=handle_error,
            on_enqueue=lambda request_id: print(f"Request {index} enqueued: {request_id}"),
        )

        return result is not None

    # Make multiple rapid requests to potentially trigger rate limiting
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_request, i) for i in range(5)]
        results = [f.result() for f in futures]

    success_count = sum(results)
    error_count = len(results) - success_count

    print(f"✓ Completed: {success_count} successful, {error_count} handled errors")


def test_multiple_error_types_with_callback():
    """Test handling of multiple error types using on_error callback (recommended)"""
    print("\n=== Multiple Error Types with on_error Callback (Recommended) ===")

    test_cases = [
        {
            "name": "Valid Request",
            "endpoint": "black-forest-labs/flux-kontext-pro/text-to-image",
            "arguments": {"prompt": "a beautiful sunset", "aspect_ratio": "16:9"}
        },
        {
            "name": "Invalid Endpoint",
            "endpoint": "invalid/model/endpoint",
            "arguments": {"prompt": "test"}
        },
        {
            "name": "Invalid Input",
            "endpoint": "black-forest-labs/flux-kontext-pro/text-to-image",
            "arguments": {"prompt": "test", "seed": -999, "aspect_ratio": "invalid_ratio"}
        }
    ]

    for test_case in test_cases:
        print(f"\n  Testing: {test_case['name']}")

        def handle_error(error: sunra_client.SunraClientError):
            print(f"    Error handled for {test_case['name']}:")
            print(f"      Code: {error.code}")
            print(f"      Message: {error.message}")
            if error.type:
                print(f"      Type: {error.type}")
            if error.details:
                print(f"      Details: {error.details}")

        result = sunra_client.subscribe(
            test_case["endpoint"],
            arguments=test_case["arguments"],
            on_error=handle_error,
            on_enqueue=lambda request_id: print(f"    Enqueued: {request_id}"),
        )

        if result:
            print(f"    ✓ {test_case['name']} succeeded")
        else:
            print(f"    ✓ {test_case['name']} error handled gracefully")


# ============================================================================
# ALTERNATIVE APPROACH: Traditional Try/Except Style
# ============================================================================

def test_validation_error_try_except():
    """Test handling of validation errors using try/except (alternative)"""
    print("\n=== Validation Error with Try/Except (Alternative) ===")
    try:
        result = sunra_client.subscribe(
            # find more models here: https://sunra.ai/models
            "black-forest-labs/flux-kontext-pro/text-to-image",
            arguments={
                "prompt": "a bedroom with messy goods on the bed and floor",
                "prompt_enhancer": False,
                "seed": -2,  # Invalid seed (should be >= 0)
                "aspect_ratio": "16:9",
                "output_format": "jpeg",
                "safety_tolerance": 6
            },
            with_logs=True,
            on_enqueue=lambda request_id: print(f"Enqueued: {request_id}"),
            on_queue_update=lambda status: print(f"Queue update: {status}"),
        )
        print(result)

    except sunra_client.SunraClientError as e:
        print("Caught SunraClientError in try/except:")
        print(f"  Type: {e.type or 'N/A'}")
        print(f"  Code: {e.code}")
        print(f"  Message: {e.message}")
        print(f"  Details: {e.details or 'N/A'}")
        print(f"  Request ID: {e.request_id or 'N/A'}")
        print(f"  Rate Limit: {e.rate_limit or 'N/A'}")
        print(f"  Timestamp: {e.timestamp or 'N/A'}")


def test_http_error_try_except():
    """Test handling of HTTP errors using try/except (alternative)"""
    print("\n=== HTTP Error with Try/Except (Alternative) ===")
    try:
        result = sunra_client.subscribe(
            "non-existent-model/endpoint",
            arguments={"prompt": "test"},
            with_logs=True,
        )
        print(result)

    except sunra_client.SunraClientError as e:
        print("Caught SunraClientError in try/except:")
        print(f"  Type: {e.type or 'N/A'}")
        print(f"  Code: {e.code}")
        print(f"  Message: {e.message}")
        print(f"  Details: {e.details or 'N/A'}")
        print(f"  Request ID: {e.request_id or 'N/A'}")
        print(f"  Rate Limit: {e.rate_limit or 'N/A'}")


def test_conditional_error_handling():
    """Test conditional error handling based on error types"""
    print("\n=== Conditional Error Handling (Try/Except Alternative) ===")

    test_cases = [
        {"prompt": "test", "seed": -1},  # Validation error
        {"invalid_param": "test"},       # Invalid parameter
    ]

    for i, test_case in enumerate(test_cases):
        print(f"\n  Test case {i + 1}: {test_case}")
        try:
            result = sunra_client.subscribe(
                "black-forest-labs/flux-kontext-pro/text-to-image",
                arguments=test_case
            )
            print(f"    ✓ Request succeeded: {result}")

        except sunra_client.SunraClientError as e:
            if e.code == "invalid_input":
                print("    → Validation error: Please check your input parameters")
            elif e.code == "Bad Request":
                print("    → Invalid API request: Check endpoint and parameters")
            elif "rate" in e.code.lower():
                print("    → Rate limit hit: Please wait before retrying")
            else:
                print(f"    → Unexpected error ({e.code}): {e.message}")


# ============================================================================
# ASYNC EXAMPLES
# ============================================================================

async def test_async_error_handling_with_callback():
    """Test async error handling with on_error callback (recommended)"""
    print("\n=== Async Error Handling with on_error Callback (Recommended) ===")

    has_error = False

    def handle_error(error: sunra_client.SunraClientError):
        nonlocal has_error
        has_error = True
        print("Async error handled gracefully by on_error callback:")
        print(f"  Code: {error.code}")
        print(f"  Message: {error.message}")
        print(f"  Type: {error.type or 'N/A'}")

    result = await sunra_client.subscribe_async(
        "non-existent-model/endpoint",
        arguments={"prompt": "async test"},
        on_error=handle_error,
    )

    if has_error:
        print("✓ Async error handled without raising exception")
    elif result:
        print(f"✓ Async request succeeded: {result}")


async def test_async_error_handling_try_except():
    """Test async error handling with try/except (alternative)"""
    print("\n=== Async Error Handling with Try/Except (Alternative) ===")

    try:
        result = await sunra_client.subscribe_async(
            "non-existent-model/endpoint",
            arguments={"prompt": "async test"},
        )
        print(result)
    except sunra_client.SunraClientError as e:
        print("Caught async SunraClientError in try/except:")
        print(f"  Code: {e.code}")
        print(f"  Message: {e.message}")


async def run_async_examples():
    """Run async error handling examples"""
    await test_async_error_handling_with_callback()
    await test_async_error_handling_try_except()


def main():
    """Main function to run all error handling examples"""
    print("🚀 Enhanced Error Handling Demo")
    print("This demo shows different approaches to error handling in the Sunra Python SDK\n")

    # RECOMMENDED: on_error callback style (non-raising)
    print("🌟 RECOMMENDED APPROACH: on_error Callback Style")
    print("This approach provides graceful error handling without exceptions\n")

    test_validation_error_with_callback()
    test_http_error_with_callback()
    test_rate_limiting_with_callback()
    test_multiple_error_types_with_callback()

    # ALTERNATIVE: try/except style (raising)
    print("\n📦 ALTERNATIVE APPROACH: Try/Except Style")
    print("This approach uses traditional exception handling\n")

    test_validation_error_try_except()
    test_http_error_try_except()
    test_conditional_error_handling()

    # ASYNC examples
    print("\n🔄 ASYNC ERROR HANDLING EXAMPLES")
    print("Both callback and try/except styles work with async functions\n")

    import asyncio
    asyncio.run(run_async_examples())

    print("\n✅ Demo completed")
    print("Key benefits of on_error callback approach:")
    print("• No exception handling required")
    print("• Graceful error handling in production")
    print("• Consistent error structure with type, code, message, details")
    print("• Automatic extraction of request ID and rate limit info")
    print("• Better user experience with non-blocking error handling")
    print("\nWhen to use try/except:")
    print("• When you need to halt execution on errors")
    print("• For debugging and development")
    print("• When integrating with existing exception-based error handling")
    print("• For conditional error handling based on error types")


if __name__ == "__main__":
    main()

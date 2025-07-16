// get your API key from https://sunra.ai/dashboard/api-tokens
// AsyncSunraClient.withEnvCredentials() reads the credentials from the environment variable SUNRA_KEY by default
import ai.sunra.client.*;
import ai.sunra.client.exception.SunraException;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import com.google.gson.JsonObject;

public class ErrorHandlingDemo {

    public static void main(String[] args) {
        testValidationErrorAsync();
        testHttpErrorAsync();
        demonstrateConditionalErrorHandlingAsync();
    }

        /**
     * Test handling of validation errors from the API (Async) - Updated with enhanced error fields
     */
    public static void testValidationErrorAsync() {
        System.out.println("=== Testing Validation Error (Async) ===");
        var client = AsyncSunraClient.withEnvCredentials();

        try {
            // find more models here: https://sunra.ai/models
            var responseFuture = client.subscribe(
                "black-forest-labs/flux-kontext-pro/text-to-image",
                SubscribeOptions.<JsonObject>builder()
                    .input(Map.of(
                        "prompt", "a bedroom with messy goods on the bed and floor",
                        "prompt_enhancer", false,
                        "seed", -2,  // Invalid seed (should be >= 0)
                        "aspect_ratio", "16:9",
                        "output_format", "jpeg",
                        "safety_tolerance", 6
                    ))
                    .resultType(JsonObject.class)
                    .onQueueUpdate(update -> System.out.printf(
                        "Status Update: %s, Request ID: %s%n",
                        update.getStatus(),
                        update.getRequestId()
                    ))
                    .logs(true)
                    .build()
            );

            // Wait for completion
            var response = responseFuture.get();
            System.out.println("Completed!");
            System.out.println(response.getData());

        } catch (ExecutionException e) {
            // Async exceptions are wrapped in ExecutionException
            if (e.getCause() instanceof SunraException) {
                var sunraException = (SunraException) e.getCause();
                System.out.println("Caught SunraException: " + sunraException.getMessage());
                System.out.println("  Request ID: " + sunraException.getRequestId());
                System.out.println("  Exception Type: " + sunraException.getClass().getSimpleName());

                if (sunraException.getCause() != null) {
                    System.out.println("  Caused by: " + sunraException.getCause().getClass().getSimpleName());
                    System.out.println("  Root cause message: " + sunraException.getCause().getMessage());
                }
            } else {
                System.out.println("Caught wrapped exception: " + e.getCause().getClass().getSimpleName());
                System.out.println("  Message: " + e.getCause().getMessage());
            }
        } catch (Exception e) {
            System.out.println("Caught unexpected exception: " + e.getClass().getSimpleName());
            System.out.println("  Message: " + e.getMessage());
            e.printStackTrace();
        }
    }

        /**
     * Test handling of HTTP errors (like 404, 401, etc.) (Async)
     */
    public static void testHttpErrorAsync() {
        System.out.println("\n=== Testing HTTP Error (Async) ===");
        var client = AsyncSunraClient.withEnvCredentials();

        try {
            // Try to access a non-existent endpoint to trigger HTTP error
            var responseFuture = client.subscribe(
                "non-existent-model/endpoint",
                SubscribeOptions.<JsonObject>builder()
                    .input(Map.of("prompt", "test"))
                    .resultType(JsonObject.class)
                    .logs(true)
                    .build()
            );

            // Wait for completion
            var response = responseFuture.get();
            System.out.println("Completed!");
            System.out.println(response.getData());

        } catch (ExecutionException e) {
            // Async exceptions are wrapped in ExecutionException
            if (e.getCause() instanceof SunraException) {
                var sunraException = (SunraException) e.getCause();
                System.out.println("Caught SunraException: " + sunraException.getMessage());
                System.out.println("  Request ID: " + sunraException.getRequestId());
                System.out.println("  Exception Type: " + sunraException.getClass().getSimpleName());

                if (sunraException.getCause() != null) {
                    System.out.println("  Caused by: " + sunraException.getCause().getClass().getSimpleName());
                    System.out.println("  Root cause message: " + sunraException.getCause().getMessage());
                }
            } else {
                System.out.println("Caught wrapped exception: " + e.getCause().getClass().getSimpleName());
                System.out.println("  Message: " + e.getCause().getMessage());
            }
        } catch (Exception e) {
            System.out.println("Caught unexpected exception: " + e.getClass().getSimpleName());
            System.out.println("  Message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Demonstrate conditional error handling based on error patterns (Async)
     */
    public static void demonstrateConditionalErrorHandlingAsync() {
        System.out.println("\n=== Demonstrating Conditional Error Handling (Async) ===");
        var client = AsyncSunraClient.withEnvCredentials();

        try {
            var responseFuture = client.subscribe(
                "test-endpoint",
                SubscribeOptions.<JsonObject>builder()
                    .input(Map.of("invalid_param", "value"))
                    .resultType(JsonObject.class)
                    .build()
            );

            // Wait for completion
            var response = responseFuture.get();

                } catch (ExecutionException e) {
            if (e.getCause() instanceof SunraException) {
                var sunraException = (SunraException) e.getCause();
                // Handle different types of errors based on message content
                String errorMessage = sunraException.getMessage().toLowerCase();

                if (errorMessage.contains("validation") || errorMessage.contains("invalid")) {
                    System.out.println("Validation Error: Please check your input parameters");
                    System.out.println("  Details: " + sunraException.getMessage());
                } else if (errorMessage.contains("not found") || errorMessage.contains("404")) {
                    System.out.println("Endpoint Not Found: Please check the model endpoint");
                    System.out.println("  Details: " + sunraException.getMessage());
                } else if (errorMessage.contains("unauthorized") || errorMessage.contains("401")) {
                    System.out.println("Authentication Error: Please check your API key");
                    System.out.println("  Details: " + sunraException.getMessage());
                } else if (errorMessage.contains("insufficient") || errorMessage.contains("credit")) {
                    System.out.println("Billing Error: Insufficient credits");
                    System.out.println("  Details: " + sunraException.getMessage());
                } else {
                    System.out.println("Unexpected Error: " + sunraException.getMessage());
                    System.out.println("  Request ID: " + sunraException.getRequestId());
                }
            }
        } catch (Exception e) {
            System.out.println("Caught unexpected exception: " + e.getClass().getSimpleName());
            System.out.println("  Message: " + e.getMessage());
        }
    }

    /**
     * Example using CompletableFuture exception handling patterns
     */
    public static void demonstrateAsyncExceptionHandling() {
        System.out.println("\n=== Demonstrating Async Exception Handling Patterns ===");
        var client = AsyncSunraClient.withEnvCredentials();

        client.subscribe(
            "black-forest-labs/flux-kontext-pro/text-to-image",
            SubscribeOptions.<JsonObject>builder()
                .input(Map.of("prompt", "test", "seed", -1))  // Invalid seed
                .resultType(JsonObject.class)
                .build()
        )
        .whenComplete((result, throwable) -> {
            if (throwable != null) {
                if (throwable instanceof SunraException) {
                    var sunraException = (SunraException) throwable;
                    System.out.println("Request failed: " + sunraException.getMessage());
                    System.out.println("Request ID: " + sunraException.getRequestId());
                } else {
                    System.out.println("Unexpected error: " + throwable.getMessage());
                    throwable.printStackTrace();
                }
            } else {
                System.out.println("Request succeeded: " + result.getRequestId());
            }
        })
        .exceptionally(throwable -> {
            System.out.println("Exception handler: " + throwable.getMessage());
            return null; // Return default value or handle gracefully
        });

        // Keep the main thread alive briefly to see async results
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

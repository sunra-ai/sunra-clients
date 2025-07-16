// get your API key from https://sunra.ai/dashboard/api-tokens
// SunraClient.withEnvCredentials() reads the credentials from the environment variable SUNRA_KEY by default
import ai.sunra.client.*;
import ai.sunra.client.exception.SunraException;
import java.util.Map;
import com.google.gson.JsonObject;

public class ErrorHandlingDemo {

    public static void main(String[] args) {
        testValidationError();
        testHttpError();
        demonstrateConditionalErrorHandling();
    }

        /**
     * Test handling of validation errors from the API
     */
    public static void testValidationError() {
        System.out.println("=== Testing Validation Error ===");
        var client = SunraClient.withEnvCredentials();

        try {
            // find more models here: https://sunra.ai/models
            var response = client.subscribe(
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

            System.out.println("Completed!");
            System.out.println(response.getData());

        } catch (SunraException e) {
            System.out.println("Caught SunraException: " + e.toString());
            System.out.println("  Message: " + e.getMessage());
            System.out.println("  Code: " + e.getCode());
            System.out.println("  Details: " + e.getDetails());
            System.out.println("  Timestamp: " + e.getTimestamp());
            System.out.println("  Request ID: " + e.getRequestId());

            // Check if it's caused by another exception
            if (e.getCause() != null) {
                System.out.println("  Caused by: " + e.getCause().getClass().getSimpleName());
                System.out.println("  Root cause message: " + e.getCause().getMessage());
            }
        } catch (Exception e) {
            System.out.println("Caught unexpected exception: " + e.getClass().getSimpleName());
            System.out.println("  Message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Test handling of HTTP errors (like 404, 401, etc.)
     */
    public static void testHttpError() {
        System.out.println("\n=== Testing HTTP Error ===");
        var client = SunraClient.withEnvCredentials();

        try {
            // Try to access a non-existent endpoint to trigger HTTP error
            var response = client.subscribe(
                "non-existent-model/endpoint",
                SubscribeOptions.<JsonObject>builder()
                    .input(Map.of("prompt", "test"))
                    .resultType(JsonObject.class)
                    .logs(true)
                    .build()
            );

            System.out.println("Completed!");
            System.out.println(response.getData());

                } catch (SunraException e) {
            System.out.println("Caught SunraException: " + e.toString());
            System.out.println("  Message: " + e.getMessage());
            System.out.println("  Code: " + e.getCode());
            System.out.println("  Details: " + e.getDetails());
            System.out.println("  Timestamp: " + e.getTimestamp());
            System.out.println("  Request ID: " + e.getRequestId());

            // Check if it's caused by another exception
            if (e.getCause() != null) {
                System.out.println("  Caused by: " + e.getCause().getClass().getSimpleName());
                System.out.println("  Root cause message: " + e.getCause().getMessage());
            }
        } catch (Exception e) {
            System.out.println("Caught unexpected exception: " + e.getClass().getSimpleName());
            System.out.println("  Message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Demonstrate conditional error handling based on error patterns
     */
    public static void demonstrateConditionalErrorHandling() {
        System.out.println("\n=== Demonstrating Conditional Error Handling ===");
        var client = SunraClient.withEnvCredentials();

        try {
            var response = client.subscribe(
                "test-endpoint",
                SubscribeOptions.<JsonObject>builder()
                    .input(Map.of("invalid_param", "value"))
                    .resultType(JsonObject.class)
                    .build()
            );

        } catch (SunraException e) {
            // Handle different types of errors based on message content
            String errorMessage = e.getMessage().toLowerCase();

            if (errorMessage.contains("validation") || errorMessage.contains("invalid")) {
                System.out.println("Validation Error: Please check your input parameters");
                System.out.println("  Details: " + e.getMessage());
            } else if (errorMessage.contains("not found") || errorMessage.contains("404")) {
                System.out.println("Endpoint Not Found: Please check the model endpoint");
                System.out.println("  Details: " + e.getMessage());
            } else if (errorMessage.contains("unauthorized") || errorMessage.contains("401")) {
                System.out.println("Authentication Error: Please check your API key");
                System.out.println("  Details: " + e.getMessage());
            } else if (errorMessage.contains("insufficient") || errorMessage.contains("credit")) {
                System.out.println("Billing Error: Insufficient credits");
                System.out.println("  Details: " + e.getMessage());
            } else {
                System.out.println("Unexpected Error: " + e.getMessage());
                System.out.println("  Request ID: " + e.getRequestId());
            }
        }
    }
}

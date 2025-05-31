package ai.sunra.client;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import ai.sunra.client.queue.QueueStatus;
import com.google.gson.JsonObject;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class SunraClientTest {

    /**
     * This test method is used to print actual API request results.
     * Creates a sunraClient instance using Config approach instead of environment variables.
     *
     * To run this test, replace the API Key below with an actual API Key.
     */
    @Test
    void testRealApiCall() {
        // Create ClientConfig with hardcoded API Key
        // Note: In real projects, avoid hardcoding API keys, this is just a test example
        String apiKey = System.getenv("SUNRA_API_KEY");
        ; // Replace with actual API Key

        try {
            // Create client instance using Config approach
            ClientConfig config = ClientConfig.builder()
                    .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                    .build();

            SunraClient realClient = SunraClient.withConfig(config);

            // Choose an endpoint that actually exists
            String realEndpointId = "sunra/fast-animatediff/text-to-video"; // Modify according to actual situation

            // Prepare test input
            Map<String, Object> input = Map.of("prompt", "the cat is running", "max_tokens", 100);

            // Execute API call
            System.out.println("Calling API endpoint: " + realEndpointId);
            System.out.println("Input parameters: " + input);

            RunOptions<JsonObject> options = RunOptions.<JsonObject>builder()
                    .input(input)
                    .resultType(JsonObject.class)
                    .build();

            Output<JsonObject> result = realClient.run(realEndpointId, options);

            // Print results
            System.out.println("\n========== API Response Results ==========");
            System.out.println("Request ID: " + result.getRequestId());
            System.out.println("Response data: " + result.getData().toString());
            System.out.println("====================================\n");

            // Basic validation
            assertNotNull(result);
            assertNotNull(result.getRequestId());
            assertNotNull(result.getData());
        } catch (Exception e) {
            System.err.println("API call failed: " + e.getMessage());
            e.printStackTrace();
            fail("API call exception: " + e.getMessage());
        }
    }

    /**
     * Test the subscribe method with real API
     * This test will actually call the API and listen for status updates
     */
    @Test
    void testRealSubscribe() {
        // Create ClientConfig with hardcoded API Key
        String apiKey = System.getenv("SUNRA_API_KEY");
        ;

        try {
            // Set connection timeout configuration
            System.setProperty("http.keepAlive", "false");
            System.setProperty("http.maxConnections", "5");

            // Create client
            ClientConfig config = ClientConfig.builder()
                    .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                    .build();

            SunraClient realClient = SunraClient.withConfig(config);

            // Choose an endpoint suitable for long-running tasks
            String realEndpointId = "sunra/fast-animatediff/text-to-video";

            // Prepare input
            Map<String, Object> input = Map.of(
                    "prompt", "a dog running in the park", "num_frames", 4 // Generate 4 frames of animation
                    );

            System.out.println("Starting to subscribe to API endpoint: " + realEndpointId);
            System.out.println("Input parameters: " + input);

            // Create status tracking variables
            final AtomicInteger statusUpdateCount = new AtomicInteger(0);
            final StringBuilder statusLog = new StringBuilder();

            // Create status update callback
            Consumer<QueueStatus.StatusUpdate> statusUpdateHandler = update -> {
                int count = statusUpdateCount.incrementAndGet();
                String status = update.getStatus().toString();
                String message =
                        String.format("\nStatus update #%d: %s, Request ID: %s", count, status, update.getRequestId());
                System.out.println(message);
                statusLog.append(message).append("\n");
            };

            // Create subscribe options
            SubscribeOptions<JsonObject> options = SubscribeOptions.<JsonObject>builder()
                    .input(input)
                    .resultType(JsonObject.class)
                    .onQueueUpdate(statusUpdateHandler)
                    .logs(true) // Enable logs
                    .build();

            // Add retry logic
            int maxRetries = 3;
            int retryCount = 0;
            Output<JsonObject> result = null;
            Exception lastException = null;

            while (retryCount < maxRetries) {
                try {
                    // Execute subscribe call
                    result = realClient.subscribe(realEndpointId, options);
                    // Break loop if successful
                    break;
                } catch (Exception e) {
                    lastException = e;
                    retryCount++;
                    System.err.println("API subscription attempt #" + retryCount + " failed: " + e.getMessage());

                    // Check if it's a StreamResetException
                    if (e.getCause() != null && e.getCause().toString().contains("StreamResetException")) {
                        System.err.println("StreamResetException detected, retrying...");
                    }

                    if (retryCount < maxRetries) {
                        // Wait for a while before retrying
                        try {
                            Thread.sleep(5000 * retryCount); // Increasing retry intervals
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            // Check if result was successfully obtained
            if (result == null) {
                fail("All API subscription attempts failed, last error: "
                        + (lastException != null ? lastException.getMessage() : "Unknown error"));
                return;
            }

            // Print result and status log
            System.out.println("\n========== Subscription Response Results ==========");
            System.out.println("Request ID: " + result.getRequestId());
            System.out.println("Number of status updates received: " + statusUpdateCount.get());
            System.out.println("Status log:\n" + statusLog.toString());
            System.out.println("Response data: " + result.getData().toString());
            System.out.println("====================================\n");

            // Basic validation
            assertNotNull(result);
            assertNotNull(result.getRequestId());
            assertNotNull(result.getData());
            assertTrue(statusUpdateCount.get() > 0, "Should receive at least one status update");

        } catch (Exception e) {
            System.err.println("API subscription failed: " + e.getMessage());
            e.printStackTrace();
            fail("API subscription exception: " + e.getMessage());
        }
    }
}

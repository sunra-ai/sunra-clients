package ai.sunra.client;

import static org.junit.jupiter.api.Assertions.*;

import ai.sunra.client.http.ClientProxyInterceptor;
import ai.sunra.client.http.CredentialsInterceptor;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.*;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import okhttp3.OkHttpClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Real API call test for QueueClientImpl
 * Note: These tests will actually call the API and require a valid API Key
 */
public class QueueClientImplRealTest {

    private QueueClientImpl queueClient;
    private String testEndpointId = "suno/suno-v4.5/text-to-lyrics";
    // For security, it's recommended to store the API Key in environment variables or config files
    private String apiKey = System.getenv("SUNRA_KEY");

    @BeforeEach
    void setUp() throws Exception {
        // Skip setup if no API key is provided
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.out.println("Skipping QueueClientImplRealTest setup: SUNRA_KEY environment variable not set");
            return;
        }

        // Configure HTTP connection settings
        System.setProperty("http.keepAlive", "false");
        System.setProperty("http.maxConnections", "5");

        // Create HttpClient, similar to the approach in SunraClientImpl
        ClientConfig config = ClientConfig.builder()
                .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                .build();

        OkHttpClient.Builder builder = new OkHttpClient.Builder().addInterceptor(new CredentialsInterceptor(config));

        // Add proxy interceptor if necessary
        if (config.getProxyUrl() != null) {
            builder.addInterceptor(new ClientProxyInterceptor(config));
        }

        // Create HttpClient
        HttpClient httpClient = new HttpClient(config, builder.build());

        // Create test target
        queueClient = new QueueClientImpl(httpClient);

        System.out.println("QueueClientImpl initialized, ready to test real API calls");
    }

    @Test
    void testSubmitAndStatus() {
        // Skip test if no API key is provided
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.out.println("Skipping testSubmitAndStatus: SUNRA_KEY environment variable not set");
            return;
        }

        try {
            // Prepare input
            Map<String, Object> input = Map.of(
                    "prompt", "a cat playing with yarn"
                    );

            System.out.println("Starting to test submit method...");

            // Execute submit call
            QueueSubmitOptions submitOptions =
                    QueueSubmitOptions.builder().input(input).build();

            QueueStatus.InQueue submitResult = queueClient.submit(testEndpointId, submitOptions);

            // Validate submission result
            assertNotNull(submitResult);
            assertNotNull(submitResult.getRequestId());

            System.out.println("Submission successful, Request ID: " + submitResult.getRequestId());
            System.out.println("Queue position: " + submitResult.getQueuePosition());

            // Test status query - may need multiple polling to see status changes
            String requestId = submitResult.getRequestId();
            QueueStatusOptions statusOptions =
                    QueueStatusOptions.builder().requestId(requestId).logs(true).build();

            System.out.println("Starting to test status method...");

            // Get status
            QueueStatus.StatusUpdate statusResult = queueClient.status(statusOptions);

            // Validate status result
            assertNotNull(statusResult);
            assertNotNull(statusResult.getStatus());

            System.out.println("Status query successful, current status: " + statusResult.getStatus());

        } catch (Exception e) {
            System.err.println("API call failed: " + e.getMessage());
            e.printStackTrace();
            fail("API call exception: " + e.getMessage());
        }
    }

    @Test
    void testSubscribeToStatus() {
        // Skip test if no API key is provided
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.out.println("Skipping testSubscribeToStatus: SUNRA_KEY environment variable not set");
            return;
        }

        try {
            // First submit a new request to get a valid request ID
            Map<String, Object> input = Map.of("prompt", "a simple test image");

            QueueSubmitOptions submitOptions = QueueSubmitOptions.builder()
                    .input(input)
                    .build();

            QueueStatus.InQueue submitResult = queueClient.submit(testEndpointId, submitOptions);
            String requestId = submitResult.getRequestId();

            System.out.println("Submission successful, Request ID: " + requestId);

            // Track status updates
            final AtomicInteger updateCount = new AtomicInteger(0);
            final StringBuilder statusLog = new StringBuilder();

            // Status update callback
            Consumer<QueueStatus.StatusUpdate> statusUpdateHandler = update -> {
                int count = updateCount.incrementAndGet();
                String status = update.getStatus().toString();
                String message =
                        String.format("\nStatus update #%d: %s, Request ID: %s", count, status, update.getRequestId());
                System.out.println(message);
                statusLog.append(message).append("\n");
            };

            // Create subscription options
            QueueSubscribeOptions subscribeOptions = QueueSubscribeOptions.builder()
                    .requestId(requestId)
                    .logs(true)
                    .onQueueUpdate(statusUpdateHandler)
                    .build();

            System.out.println("Starting to subscribe to status updates...");

            // Add retry logic
            int maxRetries = 3;
            int retryCount = 0;
            QueueStatus.Completed result = null;
            Exception lastException = null;

            while (retryCount < maxRetries) {
                try {
                    // Execute subscription call
                    result = queueClient.subscribeToStatus(subscribeOptions);
                    // Break out of loop if successful
                    break;
                } catch (Exception e) {
                    lastException = e;
                    retryCount++;
                    System.err.println("Subscription attempt #" + retryCount + " failed: " + e.getMessage());

                    // Check if it's a StreamResetException
                    if (e.getCause() != null && e.getCause().toString().contains("StreamResetException")) {
                        System.err.println("StreamResetException detected, retrying...");
                    }

                    if (retryCount < maxRetries) {
                        // Backoff strategy
                        try {
                            Thread.sleep(5000 * retryCount);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            // Check if result was successfully obtained
            if (result == null) {
                fail("All subscription attempts failed, last error: "
                        + (lastException != null ? lastException.getMessage() : "Unknown error"));
                return;
            }

            // Validate result
            assertNotNull(result);
            assertEquals(requestId, result.getRequestId());
            assertEquals(QueueStatus.Status.COMPLETED, result.getStatus());

            System.out.println("\n========== Subscription Response Result ==========");
            System.out.println("Request ID: " + result.getRequestId());
            System.out.println("Number of status updates received: " + updateCount.get());
            System.out.println("Status log:\n" + statusLog.toString());
            System.out.println("====================================\n");

            // assertTrue(updateCount.get() > 0, "Should receive at least one status update");

        } catch (Exception e) {
            System.err.println("Subscription test failed: " + e.getMessage());
            e.printStackTrace();
            fail("Subscription test exception: " + e.getMessage());
        }
    }
}

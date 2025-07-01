package client;

import static org.junit.jupiter.api.Assertions.*;

import ai.sunra.client.AsyncSunraClientImpl;
import ai.sunra.client.ClientConfig;
import ai.sunra.client.CredentialsResolver;
import ai.sunra.client.Output;
import ai.sunra.client.SubscribeOptions;
import ai.sunra.client.queue.QueueStatus;
import com.google.gson.JsonObject;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class AsyncSunraClientImplRealTest {

    private AsyncSunraClientImpl asyncClient;
    private String testEndpointId = "black-forest-labs/flux-kontext-pro/text-to-image";
    // Recommended to store API Key in environment variables or config files
    private String apiKey = System.getenv("SUNRA_KEY");

    @BeforeEach
    void setUp() {
        ClientConfig config = ClientConfig.builder()
                .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                .build();

        // Direct instantiation, not using SunraClient factory
        asyncClient = new AsyncSunraClientImpl(config);
    }

    @Test
    void testSubscribe() throws Exception {
        Map<String, Object> input = Map.of("prompt", "a dog playing with a ball");

        AtomicInteger updateCount = new AtomicInteger(0);
        Consumer<QueueStatus.StatusUpdate> onUpdate = update -> {
            int count = updateCount.incrementAndGet();
            System.out.println(
                    "Status update #" + count + ": " + update.getStatus() + ", Request ID: " + update.getRequestId());
        };

        SubscribeOptions<JsonObject> options = SubscribeOptions.<JsonObject>builder()
                .input(input)
                .resultType(JsonObject.class)
                .onQueueUpdate(onUpdate)
                .logs(true)
                .build();

        CompletableFuture<Output<JsonObject>> future = asyncClient.subscribe(testEndpointId, options);

        Output<JsonObject> result = future.get(5, TimeUnit.MINUTES);

        assertNotNull(result);
        assertNotNull(result.getRequestId());
        assertNotNull(result.getData());
        System.out.println("subscribe() Request ID: " + result.getRequestId());
        System.out.println("subscribe() Response data: " + result.getData());
        System.out.println("Number of status updates received: " + updateCount.get());
        assertTrue(updateCount.get() > 0, "Should receive at least one status update");
    }
}

package client;

import ai.sunra.client.AsyncSunraClientImpl;
import ai.sunra.client.ClientConfig;
import ai.sunra.client.CredentialsResolver;
import ai.sunra.client.Output;
import ai.sunra.client.RunOptions;
import ai.sunra.client.SubscribeOptions;
import ai.sunra.client.queue.QueueStatus;
import com.google.gson.JsonObject;
import okhttp3.OkHttpClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;

public class AsyncSunraClientImplRealTest {

    private AsyncSunraClientImpl asyncClient;
    private String testEndpointId = "sunra/fast-animatediff";
    // 建议用环境变量或配置文件存储API Key
    private String apiKey = "sk-api-x17DjLiNh5d3Y2aDyauyW7l5dXa58bZTfDPbY6YaERdDWmmKjxPTA726CeOvnKJJnM54MMMpk1A2g8wOnYWSt2MWS9eJybmgegPkIzb7njuwF4eRfJwILHo4TImY";

    @BeforeEach
    void setUp() {
        // 可自定义OkHttpClient超时
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(3, TimeUnit.MINUTES)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();

        ClientConfig config = ClientConfig.builder()
                .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                .build();

        // 直接new，不用sunraClient工厂
        asyncClient = new AsyncSunraClientImpl(config);
    }

    @Test
    void testRun() throws Exception {
        // 准备测试输入
        Map<String, Object> input = Map.of(
            "prompt", "the cat is running",
            "max_tokens", 100
        );

        RunOptions<JsonObject> options = RunOptions.<JsonObject>builder()
                .input(input)
                .resultType(JsonObject.class)
                .build();

        CompletableFuture<ai.sunra.client.Output<JsonObject>> future = asyncClient.run(testEndpointId, options);

        Output<JsonObject> result = future.get(3, TimeUnit.MINUTES);

        assertNotNull(result);
        assertNotNull(result.getRequestId());
        assertNotNull(result.getData());
        System.out.println("run() 请求ID: " + result.getRequestId());
        System.out.println("run() 响应数据: " + result.getData());
    }

    @Test
    void testSubscribe() throws Exception {
        Map<String, Object> input = Map.of(
                "prompt", "a dog playing with a ball",
                "num_frames", 2
        );

        AtomicInteger updateCount = new AtomicInteger(0);
        Consumer<QueueStatus.StatusUpdate> onUpdate = update -> {
            int count = updateCount.incrementAndGet();
            System.out.println("状态更新 #" + count + ": " + update.getStatus() + ", 请求ID: " + update.getRequestId());
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
        System.out.println("subscribe() 请求ID: " + result.getRequestId());
        System.out.println("subscribe() 响应数据: " + result.getData());
        System.out.println("收到的状态更新次数: " + updateCount.get());
        assertTrue(updateCount.get() > 0, "应该收到至少一次状态更新");
    }
}

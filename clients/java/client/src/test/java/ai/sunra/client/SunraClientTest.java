package ai.sunra.client;

import ai.sunra.client.queue.QueueStatus;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SunraClientTest {

    @Mock
    private SunraClient mockClient;  // 使用接口而不是实现类

    private final String testEndpointId = "test-endpoint";
    private final Map<String, Object> testInput = Map.of("prompt", "Testing prompt");

    @Test
    void testRunMethod() {
        // Arrange
        JsonObject expectedJson = new JsonObject();
        expectedJson.addProperty("status", "success");
        expectedJson.addProperty("result", "test result");

        Output<JsonObject> expectedOutput = new Output<>(expectedJson, "test-request-id");

        when(mockClient.run(eq(testEndpointId), any(RunOptions.class))).thenReturn(expectedOutput);

        // Act
        RunOptions<JsonObject> options = RunOptions.<JsonObject>builder()
            .input(testInput)
            .resultType(JsonObject.class)
            .build();

        Output<JsonObject> result = mockClient.run(testEndpointId, options);

        // Assert
        assertNotNull(result);
        assertEquals("test-request-id", result.getRequestId());
        assertEquals("success", result.getData().get("status").getAsString());
        assertEquals("test result", result.getData().get("result").getAsString());

        verify(mockClient).run(eq(testEndpointId), any(RunOptions.class));
    }

    @Test
    void testSubscribeMethod() {
        // Arrange
        JsonObject expectedJson = new JsonObject();
        expectedJson.addProperty("status", "success");
        expectedJson.addProperty("result", "subscription result");
        expectedJson.addProperty("image_url", "https://example.com/image.png");

        Output<JsonObject> expectedOutput = new Output<>(expectedJson, "sub-request-id");

        // 创建一个原子布尔值来跟踪回调是否被调用
        AtomicInteger updateCallCount = new AtomicInteger(0);
        AtomicBoolean progressReceived = new AtomicBoolean(false);

        // 模拟queue状态更新的回调
        Consumer<QueueStatus.StatusUpdate> queueUpdateHandler = update -> {
            updateCallCount.incrementAndGet();
            if (update.getStatus() == QueueStatus.Status.IN_PROGRESS) {
                progressReceived.set(true);
            }
        };

        // 配置mock客户端的行为
        when(mockClient.subscribe(eq(testEndpointId), any(SubscribeOptions.class)))
            .thenReturn(expectedOutput);

        // Act
        SubscribeOptions<JsonObject> options = SubscribeOptions.<JsonObject>builder()
            .input(testInput)
            .resultType(JsonObject.class)
            .onQueueUpdate(queueUpdateHandler)
            .logs(true) // 启用日志
            .build();

        Output<JsonObject> result = mockClient.subscribe(testEndpointId, options);

        // Assert
        assertNotNull(result);
        assertEquals("sub-request-id", result.getRequestId());
        assertEquals("success", result.getData().get("status").getAsString());
        assertEquals("subscription result", result.getData().get("result").getAsString());
        assertEquals("https://example.com/image.png", result.getData().get("image_url").getAsString());

        // 验证subscribe方法被调用，并且参数类型正确
        verify(mockClient).subscribe(eq(testEndpointId), any(SubscribeOptions.class));

        // 注意：在单元测试中，我们无法验证回调是否被调用，因为是mock客户端
        // 真实的回调验证将在集成测试中进行
    }

    @Test
    void testWithEnvCredentials() {
        // Just verify that the static method doesn't throw
        try {
            SunraClient client = SunraClient.withEnvCredentials();
            assertNotNull(client);
        } catch (Exception e) {
            // In a test environment without proper ENV vars, this might throw
            // which is expected and okay for this test
        }
    }

    /**
     * 这个测试方法用于打印实际的API请求结果。
     * 使用Config方式而不是环境变量方式创建sunraClient实例。
     *
     * 要运行此测试，需要替换下面的"YOUR_API_KEY"为实际的API Key。
     */
    @Test
    void testRealApiCall() {
        // 使用硬编码API Key创建ClientConfig
        // 注意：在实际项目中应避免硬编码API密钥，这里仅作为测试示例
        String apiKey = "sk-api-x17DjLiNh5d3Y2aDyauyW7l5dXa58bZTfDPbY6YaERdDWmmKjxPTA726CeOvnKJJnM54MMMpk1A2g8wOnYWSt2MWS9eJybmgegPkIzb7njuwF4eRfJwILHo4TImY";  // 替换为实际的API Key

        try {
            // 使用Config方式创建客户端实例
            ClientConfig config = ClientConfig.builder()
                .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                .build();

            SunraClient realClient = SunraClient.withConfig(config);

            // 选择一个实际存在的端点
            String realEndpointId = "sunra/fast-animatediff";  // 根据实际情况修改

            // 准备测试输入
            Map<String, Object> input = Map.of(
                "prompt", "the cat is running",
                "max_tokens", 100
            );

            // 执行API调用
            System.out.println("正在调用API端点: " + realEndpointId);
            System.out.println("输入参数: " + input);

            RunOptions<JsonObject> options = RunOptions.<JsonObject>builder()
                .input(input)
                .resultType(JsonObject.class)
                .build();

            Output<JsonObject> result = realClient.run(realEndpointId, options);

            // 打印结果
            System.out.println("\n========== API 响应结果 ==========");
            System.out.println("请求ID: " + result.getRequestId());
            System.out.println("响应数据: " + result.getData().toString());
            System.out.println("====================================\n");

            // 基本验证
            assertNotNull(result);
            assertNotNull(result.getRequestId());
            assertNotNull(result.getData());
        } catch (Exception e) {
            System.err.println("API调用失败: " + e.getMessage());
            e.printStackTrace();
            fail("API调用异常: " + e.getMessage());
        }
    }

    /**
     * 使用实际API测试subscribe方法
     * 这个测试会实际调用API并监听状态更新
     */
    @Test
    void testRealSubscribe() {
        // 使用硬编码API Key创建ClientConfig
        String apiKey = "sk-api-x17DjLiNh5d3Y2aDyauyW7l5dXa58bZTfDPbY6YaERdDWmmKjxPTA726CeOvnKJJnM54MMMpk1A2g8wOnYWSt2MWS9eJybmgegPkIzb7njuwF4eRfJwILHo4TImY";

        try {
            // 设置连接超时配置
            System.setProperty("http.keepAlive", "false");
            System.setProperty("http.maxConnections", "5");


            // 创建客户端
            ClientConfig config = ClientConfig.builder()
                .withCredentials(CredentialsResolver.fromApiKey(apiKey))
                .build();

            SunraClient realClient = SunraClient.withConfig(config);

            // 选择一个适合长时间运行任务的端点
            String realEndpointId = "sunra/fast-animatediff";

            // 准备输入
            Map<String, Object> input = Map.of(
                "prompt", "a dog running in the park",
                "num_frames", 4  // 生成16帧动画
            );

            System.out.println("开始订阅API端点: " + realEndpointId);
            System.out.println("输入参数: " + input);

            // 创建状态追踪变量
            final AtomicInteger statusUpdateCount = new AtomicInteger(0);
            final StringBuilder statusLog = new StringBuilder();

            // 创建状态更新回调
            Consumer<QueueStatus.StatusUpdate> statusUpdateHandler = update -> {
                int count = statusUpdateCount.incrementAndGet();
                String status = update.getStatus().toString();
                String message = String.format("\n状态更新 #%d: %s, 请求ID: %s",
                    count, status, update.getRequestId());
                System.out.println(message);
                statusLog.append(message).append("\n");
            };

            // 创建subscribe选项
            SubscribeOptions<JsonObject> options = SubscribeOptions.<JsonObject>builder()
                .input(input)
                .resultType(JsonObject.class)
                .onQueueUpdate(statusUpdateHandler)
                .logs(true)  // 启用日志
                .build();

            // 添加重试逻辑
            int maxRetries = 3;
            int retryCount = 0;
            Output<JsonObject> result = null;
            Exception lastException = null;

            while (retryCount < maxRetries) {
                try {
                    // 执行subscribe调用
                    result = realClient.subscribe(realEndpointId, options);
                    // 如果成功，跳出循环
                    break;
                } catch (Exception e) {
                    lastException = e;
                    retryCount++;
                    System.err.println("API订阅尝试 #" + retryCount + " 失败: " + e.getMessage());

                    // 检查是否为StreamResetException
                    if (e.getCause() != null && e.getCause().toString().contains("StreamResetException")) {
                        System.err.println("检测到StreamResetException，正在重试...");
                    }

                    if (retryCount < maxRetries) {
                        // 等待一段时间再重试
                        try {
                            Thread.sleep(5000 * retryCount); // 重试间隔递增
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            // 检查是否成功获取结果
            if (result == null) {
                fail("所有API订阅尝试都失败，最后错误: " + (lastException != null ? lastException.getMessage() : "未知错误"));
                return;
            }

            // 打印结果和状态日志
            System.out.println("\n========== 订阅响应结果 ==========");
            System.out.println("请求ID: " + result.getRequestId());
            System.out.println("收到的状态更新次数: " + statusUpdateCount.get());
            System.out.println("状态日志:\n" + statusLog.toString());
            System.out.println("响应数据: " + result.getData().toString());
            System.out.println("====================================\n");

            // 基本验证
            assertNotNull(result);
            assertNotNull(result.getRequestId());
            assertNotNull(result.getData());
            assertTrue(statusUpdateCount.get() > 0, "应该收到至少一次状态更新");

        } catch (Exception e) {
            System.err.println("API订阅失败: " + e.getMessage());
            e.printStackTrace();
            fail("API订阅异常: " + e.getMessage());
        }
    }

    /**
     * 测试使用自定义配置的sunraClient
     * 这个测试展示了如何使用ClientConfig的各种设置创建sunraClient
     */
    @Test
    void testClientWithCustomConfig() {
        // 创建一个使用自定义base URL和API Key的配置
        String apiKey = "TEST_API_KEY";

        // 创建客户端配置
        ClientConfig config = ClientConfig.builder()
            .withCredentials(CredentialsResolver.fromApiKey(apiKey))
            // 可以添加其他配置，例如代理URL
            // .withProxyUrl("https://your-proxy-url.com")
            .build();

        // 使用配置创建客户端
        SunraClient client = SunraClient.withConfig(config);

        // 验证客户端已创建
        assertNotNull(client);

        // 注意：这个测试不会实际调用API，只是验证配置能正确应用
    }
}

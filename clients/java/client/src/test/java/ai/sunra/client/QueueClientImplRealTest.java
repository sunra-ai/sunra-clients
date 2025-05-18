package ai.sunra.client;

import ai.sunra.client.ClientConfig;
import ai.sunra.client.CredentialsResolver;
import ai.sunra.client.Output;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.http.ClientProxyInterceptor;
import ai.sunra.client.http.CredentialsInterceptor;
import ai.sunra.client.queue.*;
import com.google.gson.JsonObject;
import okhttp3.OkHttpClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;

/**
 * QueueClientImpl的真实API调用测试
 * 注意：这些测试会实际调用API，需要有效的API Key
 */
public class QueueClientImplRealTest {

    private QueueClientImpl queueClient;
    private String testEndpointId = "sunra/fast-animatediff";
    // 为了安全，建议使用环境变量或配置文件存储API Key
    private String apiKey = "sk-api-x17DjLiNh5d3Y2aDyauyW7l5dXa58bZTfDPbY6YaERdDWmmKjxPTA726CeOvnKJJnM54MMMpk1A2g8wOnYWSt2MWS9eJybmgegPkIzb7njuwF4eRfJwILHo4TImY";

    @BeforeEach
    void setUp() throws Exception {
        // 设置HTTP连接配置
        System.setProperty("http.keepAlive", "false");
        System.setProperty("http.maxConnections", "5");

        // 创建HttpClient，方式与sunraClientImpl中相同
        ClientConfig config = ClientConfig.builder()
            .withCredentials(CredentialsResolver.fromApiKey(apiKey))
            .build();

        OkHttpClient.Builder builder = new OkHttpClient.Builder()
            .addInterceptor(new CredentialsInterceptor(config));

        // 添加代理拦截器（如有必要）
        if (config.getProxyUrl() != null) {
            builder.addInterceptor(new ClientProxyInterceptor(config));
        }

        // 创建HttpClient
        HttpClient httpClient = new HttpClient(config, builder.build());

        // 创建测试目标
        queueClient = new QueueClientImpl(httpClient);

        System.out.println("已初始化QueueClientImpl，准备测试真实API调用");
    }

    @Test
    void testSubmitAndStatus() {
        try {
            // 准备输入
            Map<String, Object> input = Map.of(
                "prompt", "a cat playing with yarn",
                "num_frames", 4 // 减少帧数加快测试
            );

            System.out.println("开始测试submit方法...");

            // 执行submit调用
            QueueSubmitOptions submitOptions = QueueSubmitOptions.builder()
                .input(input)
                .build();

            QueueStatus.InQueue submitResult = queueClient.submit(testEndpointId, submitOptions);

            // 验证提交结果
            assertNotNull(submitResult);
            assertNotNull(submitResult.getRequestId());
//            assertEquals(QueueStatus.Status.IN_QUEUE, submitResult.getStatus());
//            assertNotNull(submitResult.getQueuePosition());

            System.out.println("提交成功，请求ID: " + submitResult.getRequestId());
            System.out.println("队列位置: " + submitResult.getQueuePosition());

            // 测试状态查询 - 可能需要轮询多次来查看状态变化
            String requestId = submitResult.getRequestId();
            QueueStatusOptions statusOptions = QueueStatusOptions.builder()
                .requestId(requestId)
                .logs(true)
                .build();

            System.out.println("开始测试status方法...");

            // 获取状态
            QueueStatus.StatusUpdate statusResult = queueClient.status(testEndpointId, statusOptions);

            // 验证状态结果
            assertNotNull(statusResult);
//            assertEquals(requestId, statusResult.getRequestId());
            assertNotNull(statusResult.getStatus());

            System.out.println("状态查询成功，当前状态: " + statusResult.getStatus());

        } catch (Exception e) {
            System.err.println("API调用失败: " + e.getMessage());
            e.printStackTrace();
            fail("API调用异常: " + e.getMessage());
        }
    }

    @Test
    void testSubscribeToStatus() {
        try {
            String requestId = "pd_mFufCrWZQngDGUzNvNA8xqrr";

            System.out.println("提交成功，请求ID: " + requestId);

            // 跟踪状态更新
            final AtomicInteger updateCount = new AtomicInteger(0);
            final StringBuilder statusLog = new StringBuilder();

            // 状态更新回调
            Consumer<QueueStatus.StatusUpdate> statusUpdateHandler = update -> {
                int count = updateCount.incrementAndGet();
                String status = update.getStatus().toString();
                String message = String.format("\n状态更新 #%d: %s, 请求ID: %s",
                    count, status, update.getRequestId());
                System.out.println(message);
                statusLog.append(message).append("\n");
            };

            // 创建订阅选项
            QueueSubscribeOptions subscribeOptions = QueueSubscribeOptions.builder()
                .requestId(requestId)
                .logs(true)
                .onQueueUpdate(statusUpdateHandler)
                .build();

            System.out.println("开始订阅状态更新...");

            // 添加重试逻辑
            int maxRetries = 3;
            int retryCount = 0;
            QueueStatus.Completed result = null;
            Exception lastException = null;

            while (retryCount < maxRetries) {
                try {
                    // 执行订阅调用
                    result = queueClient.subscribeToStatus(testEndpointId, subscribeOptions);
                    // 成功则跳出循环
                    break;
                } catch (Exception e) {
                    lastException = e;
                    retryCount++;
                    System.err.println("订阅尝试 #" + retryCount + " 失败: " + e.getMessage());

                    // 检查是否为StreamResetException
                    if (e.getCause() != null && e.getCause().toString().contains("StreamResetException")) {
                        System.err.println("检测到StreamResetException，正在重试...");
                    }

                    if (retryCount < maxRetries) {
                        // 退避策略
                        try {
                            Thread.sleep(5000 * retryCount);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            // 检查是否成功获取结果
            if (result == null) {
                fail("所有订阅尝试都失败，最后错误: " +
                    (lastException != null ? lastException.getMessage() : "未知错误"));
                return;
            }

            // 验证结果
            assertNotNull(result);
            assertEquals(requestId, result.getRequestId());
            assertEquals(QueueStatus.Status.COMPLETED, result.getStatus());

            System.out.println("\n========== 订阅响应结果 ==========");
            System.out.println("请求ID: " + result.getRequestId());
            System.out.println("收到的状态更新次数: " + updateCount.get());
            System.out.println("状态日志:\n" + statusLog.toString());
            System.out.println("====================================\n");

            assertTrue(updateCount.get() > 0, "应该收到至少一次状态更新");

        } catch (Exception e) {
            System.err.println("订阅测试失败: " + e.getMessage());
            e.printStackTrace();
            fail("订阅测试异常: " + e.getMessage());
        }
    }

    @Test
    void testResultAfterCompletion() {
        try {
            // 准备输入
            Map<String, Object> input = Map.of(
                "prompt", "a butterfly on a flower",
                "num_frames", 4 // 减少帧数加快测试
            );

            System.out.println("开始测试完整流程: submit -> subscribeToStatus -> result");

            // 1. 首先提交请求
            QueueSubmitOptions submitOptions = QueueSubmitOptions.builder()
                .input(input)
                .build();

            QueueStatus.InQueue submitResult = queueClient.submit(testEndpointId, submitOptions);
            String requestId = submitResult.getRequestId();

            System.out.println("提交成功，请求ID: " + requestId);

            // 2. 等待任务完成
            final AtomicReference<QueueStatus.Completed> completedRef = new AtomicReference<>();

            // 状态更新回调
            Consumer<QueueStatus.StatusUpdate> statusUpdateHandler = update -> {
                System.out.println("收到状态更新: " + update.getStatus());
                if (update instanceof QueueStatus.Completed) {
                    completedRef.set((QueueStatus.Completed) update);
                }
            };

            // 创建订阅选项
            QueueSubscribeOptions subscribeOptions = QueueSubscribeOptions.builder()
                .requestId(requestId)
                .logs(true)
                .onQueueUpdate(statusUpdateHandler)
                .build();

            System.out.println("等待任务完成...");

            // 执行订阅（带重试）
            int maxRetries = 3;
            int retryCount = 0;
            QueueStatus.Completed completed = null;

            while (retryCount < maxRetries && completed == null) {
                try {
                    completed = queueClient.subscribeToStatus(testEndpointId, subscribeOptions);
                    break;
                } catch (Exception e) {
                    retryCount++;
                    System.err.println("订阅尝试 #" + retryCount + " 失败: " + e.getMessage());

                    if (retryCount < maxRetries) {
                        try {
                            Thread.sleep(5000 * retryCount);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            if (completed == null) {
                fail("无法获取完成状态");
                return;
            }

            System.out.println("任务已完成，开始获取结果...");

            // 3. 获取结果
            QueueResultOptions<JsonObject> resultOptions = QueueResultOptions.<JsonObject>builder()
                .requestId(requestId)
                .resultType(JsonObject.class)
                .build();

            Output<JsonObject> resultOutput = queueClient.result(testEndpointId, resultOptions);

            // 验证结果
            assertNotNull(resultOutput);
            assertEquals(requestId, resultOutput.getRequestId());
            assertNotNull(resultOutput.getData());

            System.out.println("\n========== 任务结果 ==========");
            System.out.println("请求ID: " + resultOutput.getRequestId());
            System.out.println("结果数据: " + resultOutput.getData().toString());
            System.out.println("=================================\n");

        } catch (Exception e) {
            System.err.println("结果获取测试失败: " + e.getMessage());
            e.printStackTrace();
            fail("结果获取测试异常: " + e.getMessage());
        }
    }

    /**
     * 专门测试status方法，仅查询任务状态
     */
    @Test
    void testStatusMethod() {
        try {

            String requestId = "pd_9fBxBgJLGPynGDGJdzspKyBm";

            System.out.println("已获取到请求ID: " + requestId + " 用于状态查询测试");

            // 创建状态查询选项
            QueueStatusOptions statusOptions = QueueStatusOptions.builder()
                .requestId(requestId)
                .logs(true)  // 包含日志信息
                .build();

            System.out.println("开始测试status方法...");

            // 执行状态查询
            QueueStatus.StatusUpdate statusResult = queueClient.status(testEndpointId, statusOptions);

            // 验证状态结果
            assertNotNull(statusResult, "状态结果不应为空");
            assertNotNull(statusResult.getStatus(), "状态不应为空");
            assertNotNull(statusResult.getStatusUrl(), "状态URL不应为空");
            assertNotNull(statusResult.getResponseUrl(), "响应URL不应为空");
            assertNotNull(statusResult.getCancelUrl(), "取消URL不应为空");

            // 输出状态结果
            System.out.println("状态查询成功，当前状态: " + statusResult.getStatus());
            System.out.println("请求ID: " + statusResult.getRequestId());

            // 根据不同状态类型验证特定属性
            if (statusResult instanceof QueueStatus.InQueue) {
                QueueStatus.InQueue inQueueStatus = (QueueStatus.InQueue) statusResult;
                System.out.println("队列位置: " + inQueueStatus.getQueuePosition());
                assertNotNull(inQueueStatus.getQueuePosition(), "队列位置不应为空");
            } else if (statusResult instanceof QueueStatus.InProgress) {
                QueueStatus.InProgress inProgressStatus = (QueueStatus.InProgress) statusResult;
                System.out.println("进行中状态，日志: " +
                                 inProgressStatus.getLogs());
            } else if (statusResult instanceof QueueStatus.Completed) {
                QueueStatus.Completed completedStatus = (QueueStatus.Completed) statusResult;
                System.out.println("已完成状态，日志: " +
                                 completedStatus.getLogs());
            }

        } catch (Exception e) {
            System.err.println("状态查询测试失败: " + e.getMessage());
            e.printStackTrace();
            fail("状态查询测试异常: " + e.getMessage());
        }
    }

    @Test
    void testResultMethod() {
        try {
            // 首先需要一个已完成任务的请求ID
            // 选项1：使用已知的请求ID
            String requestId = "pd_9fBxBgJLGPynGDGJdzspKyBm"; // 替换为一个已知完成的任务ID

            // 创建结果查询选项
            QueueResultOptions<JsonObject> resultOptions = QueueResultOptions.<JsonObject>builder()
                .requestId(requestId)
                .resultType(JsonObject.class)
                .build();

            System.out.println("开始获取任务结果...");

            // 添加result调用的重试逻辑
            int maxResultRetries = 3;
            int resultRetryCount = 0;
            Output<JsonObject> resultOutput = null;
            Exception lastException = null;

            while (resultRetryCount < maxResultRetries && resultOutput == null) {
                try {
                    // 执行result调用
                    resultOutput = queueClient.result(testEndpointId, resultOptions);
                    System.out.println("成功获取结果!");
                } catch (Exception e) {
                    lastException = e;
                    resultRetryCount++;
                    System.err.println("获取结果尝试 #" + resultRetryCount + " 失败: " + e.getMessage());

                    if (resultRetryCount < maxResultRetries) {
                        System.out.println("等待3秒后重试...");
                        Thread.sleep(3000);
                    }
                }
            }

            // 检查是否成功获取结果
            if (resultOutput == null) {
                fail("所有获取结果的尝试都失败，最后错误: " +
                    (lastException != null ? lastException.getMessage() : "未知错误"));
                return;
            }

            // 验证结果
            assertNotNull(resultOutput, "结果不应为空");
            assertNotNull(resultOutput.getRequestId(), "结果的请求ID不应为空");
//            assertEquals(requestId, resultOutput.getRequestId(), "请求ID应匹配");
            assertNotNull(resultOutput.getData(), "结果数据不应为空");

            // 打印结果信息
            System.out.println("\n========== 任务结果详情 ==========");
            System.out.println("请求ID: " + resultOutput.getRequestId());

            JsonObject resultData = resultOutput.getData();

            // 检查并输出常见字段
            if (resultData.has("status")) {
                System.out.println("结果状态: " + resultData.get("status").getAsString());
            }

            if (resultData.has("output_urls")) {
                try {
                    JsonObject outputUrls = resultData.getAsJsonObject("output_urls");
                    System.out.println("输出URL数量: " + outputUrls.size());

                    // 列出所有URL
                    for (String key : outputUrls.keySet()) {
                        System.out.println("  - " + key + ": " + outputUrls.get(key).getAsString());
                    }
                } catch (Exception e) {
                    System.out.println("输出URL解析失败: " + e.getMessage());
                }
            }

            if (resultData.has("result")) {
                try {
                    System.out.println("结果内容: " + resultData.get("result").toString());
                } catch (Exception e) {
                    System.out.println("结果内容解析失败: " + e.getMessage());
                }
            }

            // 输出完整的JSON数据（如果较小）
            if (resultData.toString().length() < 1000) {
                System.out.println("完整结果数据: " + resultData);
            } else {
                System.out.println("完整结果数据较大，长度: " + resultData.toString().length() + " 字符");
            }

            System.out.println("=================================\n");

        } catch (Exception e) {
            System.err.println("Result方法测试失败: " + e.getMessage());
            e.printStackTrace();
            fail("Result方法测试异常: " + e.getMessage());
        }
    }

//    /**
//     * 专门测试subscribeToStatus方法，处理事件流订阅
//     */
//    @Test
//    void testSubscribeToStatus() {
//        try {
//
//            String requestId = "pd_mFufCrWZQngDGUzNvNA8xqrr";
//
//            // 创建状态更新跟踪器
//            final AtomicInteger statusUpdateCount = new AtomicInteger(0);
//            final StringBuilder statusLog = new StringBuilder();
//
//            // 状态更新回调
//            Consumer<QueueStatus.StatusUpdate> statusUpdateHandler = update -> {
//                int count = statusUpdateCount.incrementAndGet();
//                QueueStatus.Status status = update.getStatus();
//                String message = String.format("\n状态更新 #%d: %s, 请求ID: %s",
//                    count, status, update.getRequestId());
//                System.out.println(message);
//                statusLog.append(message).append("\n");
//
//
//                // 打印日志信息(如果有)
//                if (update instanceof QueueStatus.InProgress) {
//                    QueueStatus.InProgress inProgress = (QueueStatus.InProgress) update;
//                    System.out.println("  进度日志: " + inProgress.getLogs());
//                } else if (update instanceof QueueStatus.Completed) {
//                    QueueStatus.Completed completed = (QueueStatus.Completed) update;
//                    System.out.println("  完成日志: " + completed.getLogs());
//                }
//            };
//
//            // 创建订阅选项
//            QueueSubscribeOptions subscribeOptions = QueueSubscribeOptions.builder()
//                .requestId(requestId)
//                .logs(true)
//                .onQueueUpdate(statusUpdateHandler)
//                .build();
//
//            System.out.println("步骤2: 开始事件流订阅...");
//
//            // 设置超时时间
//            long startTime = System.currentTimeMillis();
//            long maxWaitTime = 5 * 60 * 1000;  // 最长等待5分钟
//            long statusCheckInterval = 30 * 1000;  // 每30秒检查一次
//
//            // 使用独立线程进行状态订阅
//            AtomicReference<QueueStatus.Completed> completedResultRef = new AtomicReference<>();
//            AtomicReference<Exception> subscribeExceptionRef = new AtomicReference<>();
//
//            Thread subscribeThread = new Thread(() -> {
//                try {
//                    QueueStatus.Completed completed = queueClient.subscribeToStatus(testEndpointId, subscribeOptions);
//                    completedResultRef.set(completed);
//                } catch (Exception e) {
//                    subscribeExceptionRef.set(e);
//                }
//            });
//
//            // 启动订阅线程
//            subscribeThread.start();
//            System.out.println("订阅线程已启动，等待状态更新...");
//
//            // 主线程等待，并定期检查状态
//            boolean completed = false;
//            Exception subscribeException = null;
//
//            while (!completed && System.currentTimeMillis() - startTime < maxWaitTime) {
//                // 检查订阅线程是否已完成
//                if (!subscribeThread.isAlive()) {
//                    if (completedResultRef.get() != null) {
//                        System.out.println("订阅成功完成!");
//                        completed = true;
//                    } else if (subscribeExceptionRef.get() != null) {
//                        subscribeException = subscribeExceptionRef.get();
//                        System.err.println("订阅异常: " + subscribeException.getMessage());
//                        break;
//                    }
//                }
//
//                // 等待一段时间
//                try {
//                    Thread.sleep(statusCheckInterval);
//                } catch (InterruptedException e) {
//                    Thread.currentThread().interrupt();
//                    break;
//                }
//            }
//
//            // 如果订阅线程仍在运行但已超时，尝试中断
//            if (subscribeThread.isAlive() && System.currentTimeMillis() - startTime >= maxWaitTime) {
//                System.out.println("订阅等待超时，尝试中断订阅线程...");
//                subscribeThread.interrupt();
//
//                // 等待线程终止
//                try {
//                    subscribeThread.join(10000);  // 给10秒钟让线程终止
//                } catch (InterruptedException e) {
//                    Thread.currentThread().interrupt();
//                }
//            }
//
//            // 获取订阅结果
//            QueueStatus.Completed completedResult = completedResultRef.get();
//
//            // 输出测试结果摘要
//            System.out.println("\n========== subscribeToStatus测试结果 ==========");
//            System.out.println("请求ID: " + requestId);
//            System.out.println("收到的状态更新次数: " + statusUpdateCount.get());
//
//            if (completedResult != null) {
//                System.out.println("订阅成功完成，完成状态: " + completedResult.getStatus());
//                System.out.println("完成日志: " + completedResult.getLogs());
//            } else if (subscribeException != null) {
//                System.out.println("订阅异常: " + subscribeException.getMessage());
//            } else {
//                System.out.println("订阅超时，未能获得完成状态");
//            }
//
//            System.out.println("状态更新日志:\n" + statusLog.toString());
//            System.out.println("==============================================\n");
//
//            // 步骤3: 即使订阅未完成，也尝试获取当前状态
//            System.out.println("步骤3: 获取当前任务状态...");
//
//            try {
//                QueueStatusOptions statusOptions = QueueStatusOptions.builder()
//                    .requestId(requestId)
//                    .logs(true)
//                    .build();
//
//                QueueStatus.StatusUpdate currentStatus = queueClient.status(testEndpointId, statusOptions);
//
//                System.out.println("当前任务状态: " + currentStatus.getStatus());
//                if (currentStatus instanceof QueueStatus.Completed) {
//                    System.out.println("任务已完成!");
//                } else if (currentStatus instanceof QueueStatus.InProgress) {
//                    System.out.println("任务进行中...");
//                } else if (currentStatus instanceof QueueStatus.InQueue) {
//                    System.out.println("任务在队列中...");
//                }
//            } catch (Exception e) {
//                System.err.println("获取当前状态失败: " + e.getMessage());
//            }
//
//            // 验证测试结果
//            assertTrue(statusUpdateCount.get() > 0, "应该收到至少一次状态更新");
//
//            // 如果成功完成，进行更多验证
//            if (completedResult != null) {
//                assertNotNull(completedResult.getRequestId(), "完成结果的请求ID不应为空");
//                assertEquals(requestId, completedResult.getRequestId(), "完成结果的请求ID应与原始请求ID匹配");
//                assertEquals(QueueStatus.Status.COMPLETED, completedResult.getStatus(), "完成结果的状态应为COMPLETED");
//            }
//            // 注意：即使未完成也不会导致测试失败
//
//        } catch (Exception e) {
//            System.err.println("subscribeToStatus测试失败: " + e.getMessage());
//            e.printStackTrace();
//            fail("subscribeToStatus测试异常: " + e.getMessage());
//        }
//    }
}

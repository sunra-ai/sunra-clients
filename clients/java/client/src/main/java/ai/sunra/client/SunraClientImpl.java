package ai.sunra.client;

import ai.sunra.client.http.ClientProxyInterceptor;
import ai.sunra.client.http.CredentialsInterceptor;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.*;
import jakarta.annotation.Nonnull;
import okhttp3.OkHttpClient;

/**
 * The Sunra client implementation.
 */
public class SunraClientImpl implements SunraClient {

    /**
     * The HTTP client.
     */
    private final HttpClient httpClient;

    /**
     * The Queue client.
     */
    private final QueueClient queueClient;

    /**
     * Create a new Sunra client implementation.
     *
     * @param config The client configuration.
     */
    SunraClientImpl(@Nonnull ClientConfig config) {
        final var builder = new OkHttpClient.Builder().addInterceptor(new CredentialsInterceptor(config));
        if (config.getProxyUrl() != null) {
            builder.addInterceptor(new ClientProxyInterceptor(config));
        }
        this.httpClient = new HttpClient(config, builder.build());
        this.queueClient = new QueueClientImpl(this.httpClient);
    }

    /**
     * Subscribe to the specified endpoint with the provided options.
     *
     * @param endpointId The endpoint ID to subscribe to.
     * @param options The subscribe options.
     * @return The output.
     */
    @Override
    @Nonnull
    public <O> Output<O> subscribe(String endpointId, SubscribeOptions<O> options) {
        final var enqueued = queueClient.submit(
                endpointId,
                QueueSubmitOptions.builder()
                        .input(options.getInput())
                        .webhookUrl(options.getWebhookUrl())
                        .build());

        final var completed = queueClient.subscribeToStatus(
                endpointId,
                QueueSubscribeOptions.builder()
                        .requestId(enqueued.getRequestId())
                        .logs(options.getLogs())
                        .onQueueUpdate(options.getOnQueueUpdate())
                        .build());

        return queueClient.result(
                endpointId,
                QueueResultOptions.<O>builder()
                        .requestId(completed.getRequestId())
                        .resultType(options.getResultType())
                        .build());
    }

    /**
     * Get the queue client.
     *
     * @return The queue client.
     */
    @Override
    public QueueClient queue() {
        return this.queueClient;
    }
}

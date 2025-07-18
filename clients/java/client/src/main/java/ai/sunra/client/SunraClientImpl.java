package ai.sunra.client;

import ai.sunra.client.exception.SunraException;
import ai.sunra.client.http.ClientProxyInterceptor;
import ai.sunra.client.http.CredentialsInterceptor;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.*;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
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
     * @return The output, or null if onError callback is provided and an error occurs.
     */
    @Override
    @Nullable
    public <O> Output<O> subscribe(String endpointId, SubscribeOptions<O> options) {
        try {
            final var enqueued = queueClient.submit(
                    endpointId,
                    QueueSubmitOptions.builder()
                            .input(options.getInput())
                            .webhookUrl(options.getWebhookUrl())
                            .build());

            final var completed = queueClient.subscribeToStatus(
                    QueueSubscribeOptions.builder()
                            .requestId(enqueued.getRequestId())
                            .logs(options.getLogs())
                            .onQueueUpdate(options.getOnQueueUpdate())
                            .build());

            return queueClient.result(
                    QueueResultOptions.<O>builder()
                            .requestId(completed.getRequestId())
                            .resultType(options.getResultType())
                            .build());
        } catch (SunraException e) {
            if (options.getOnError() != null) {
                options.getOnError().accept(e);
                return null; // Don't throw if onError is provided
            }
            throw e;
        }
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

package ai.sunra.client;

import ai.sunra.client.http.ClientProxyInterceptor;
import ai.sunra.client.http.CredentialsInterceptor;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.*;
import jakarta.annotation.Nonnull;
import okhttp3.OkHttpClient;

public class SunraClientImpl implements SunraClient {

    private final HttpClient httpClient;
    private final QueueClient queueClient;

    SunraClientImpl(@Nonnull ClientConfig config) {
        final var builder = new OkHttpClient.Builder().addInterceptor(new CredentialsInterceptor(config));
        if (config.getProxyUrl() != null) {
            builder.addInterceptor(new ClientProxyInterceptor(config));
        }
        this.httpClient = new HttpClient(config, builder.build());
        this.queueClient = new QueueClientImpl(this.httpClient);
    }

    @Override
    @Nonnull
    public <O> Output<O> run(String endpointId, RunOptions<O> options) {
        final var url = "https://api.sunra.ai/v1/queue/" + endpointId + "/text-to-video";
        final var request = httpClient.prepareRequest(url, options);
        final var response = httpClient.executeRequest(request);
        return httpClient.wrapInResult(response, options.getResultType());
    }

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

    @Override
    public QueueClient queue() {
        return this.queueClient;
    }
}

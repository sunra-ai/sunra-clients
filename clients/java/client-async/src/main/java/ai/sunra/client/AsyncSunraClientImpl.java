package ai.sunra.client;
import ai.sunra.client.http.ClientProxyInterceptor;
import ai.sunra.client.http.CredentialsInterceptor;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.*;
import java.util.concurrent.CompletableFuture;
import okhttp3.OkHttpClient;

public class AsyncSunraClientImpl implements AsyncSunraClient {
    private final HttpClient httpClient;

    private final AsyncQueueClient queueClient;

    public AsyncSunraClientImpl(ClientConfig config) {
        final var builder = new OkHttpClient.Builder().addInterceptor(new CredentialsInterceptor(config));
        if (config.getProxyUrl() != null) {
            builder.addInterceptor(new ClientProxyInterceptor(config));
        }
        this.httpClient = new HttpClient(config, builder.build());
        this.queueClient = new AsyncQueueClientImpl(this.httpClient);
    }

    @Override
    public <O> CompletableFuture<Output<O>> subscribe(String endpointId, SubscribeOptions<O> options) {
        return queueClient
                .submit(
                        endpointId,
                        QueueSubmitOptions.builder()
                                .input(options.getInput())
                                .webhookUrl(options.getWebhookUrl())
                                .build())
                .thenCompose((submitted) -> queueClient.subscribeToStatus(
                        QueueSubscribeOptions.builder()
                                .requestId(submitted.getRequestId())
                                .logs(options.getLogs())
                                .onQueueUpdate(options.getOnQueueUpdate())
                                .build()))
                .thenCompose((completed) -> queueClient.result(
                        QueueResultOptions.<O>builder()
                                .requestId(completed.getRequestId())
                                .resultType(options.getResultType())
                                .build()));
    }

    @Override
    public AsyncQueueClient queue() {
        return this.queueClient;
    }
}

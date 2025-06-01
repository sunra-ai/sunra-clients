package ai.sunra.client;

import ai.sunra.client.queue.AsyncQueueClient;
import jakarta.annotation.Nonnull;
import java.util.concurrent.CompletableFuture;

public interface AsyncSunraClient {

    <O> CompletableFuture<Output<O>> run(String endpointId, RunOptions<O> options);

    <O> CompletableFuture<Output<O>> subscribe(String endpointId, SubscribeOptions<O> options);

    AsyncQueueClient queue();

    /**
     * Create a new client instance with the provided configuration.
     *
     * @param config The client configuration.
     * @return The new client instance.
     */
    static AsyncSunraClient withConfig(@Nonnull ClientConfig config) {
        return new AsyncSunraClientImpl(config);
    }

    /**
     * Create a new client instance with the credentials resolved from the `sunra_KEY` environment
     * variable.
     *
     * @return The new client instance.
     */
    static AsyncSunraClient withEnvCredentials() {
        return new AsyncSunraClientImpl(ClientConfig.withCredentials(CredentialsResolver.fromEnv()));
    }

    /**
     * Create a new client instance with the provided proxy URL. With this configuration all
     * requests will be proxied through the provided URL and the sunra target url will be in a request
     * header called `X-Sunra-Target-Url`.
     *
     * @param proxyUrl The proxy URL.
     * @return The new client instance.
     */
    static AsyncSunraClient withProxyUrl(@Nonnull String proxyUrl) {
        return new AsyncSunraClientImpl(
                ClientConfig.builder().withProxyUrl(proxyUrl).build());
    }
}

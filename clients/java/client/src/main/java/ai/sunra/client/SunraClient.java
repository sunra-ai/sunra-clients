package ai.sunra.client;

import ai.sunra.client.queue.QueueClient;
import jakarta.annotation.Nonnull;

/**
 * The main client interface for interacting with the sunra APIs.
 *
 * @see #withConfig(ClientConfig) method to create a new client instance
 * with the provided configuration.
 * @see #withEnvCredentials() method to create a new client instance
 * with the credentials resolved from the environment.
 */
public interface SunraClient {

    /**
     * Run the specified endpoint with the provided options. This method is only recommended for
     * short-running operations. For long-running operations, consider using the {@link
     * #subscribe(String, SubscribeOptions)} method to subscribe to the endpoint's results via
     * the queue or {@link #queue()} client for specific queue operations. .
     *
     * @param <O> Output type.
     * @param endpointId The endpoint ID to run, e.g. `sunra-ai/fast-sdxl`.
     * @param options The run options.
     * @return The result of the operation.
     */
    <O> Output<O> run(String endpointId, RunOptions<O> options);

    /**
     * Subscribe to the specified endpoint with the provided options. This method is recommended for
     * long-running operations. The subscription will return the result once the operation is
     * completed.
     *
     * @param <O> Output type.
     * @param endpointId The endpoint ID to subscribe to, e.g. `sunra-ai/fast-sdxl`.
     * @param options The subscribe options.
     * @return The result of the operation.
     * @see #queue()
     */
    <O> Output<O> subscribe(String endpointId, SubscribeOptions<O> options);

    /**
     * Get the queue client for interacting with the sunra queue.
     *
     * @return The queue client.
     */
    QueueClient queue();

    /**
     * Create a new client instance with the provided configuration.
     *
     * @param config The client configuration.
     * @return The new client instance.
     */
    static SunraClient withConfig(@Nonnull ClientConfig config) {
        return new SunraClientImpl(config);
    }

    /**
     * Create a new client instance with the credentials resolved from the `sunra_KEY` environment
     * variable.
     *
     * @return The new client instance.
     */
    static SunraClient withEnvCredentials() {
        return new SunraClientImpl(ClientConfig.withCredentials(CredentialsResolver.fromEnv()));
    }

    /**
     * Create a new client instance with the provided proxy URL. With this configuration all
     * requests will be proxied through the provided URL and the sunra target url will be in a request
     * header called `X-sunra-Target-Url`.
     *
     * @param proxyUrl The proxy URL.
     * @return The new client instance.
     */
    static SunraClient withProxyUrl(@Nonnull String proxyUrl) {
        return new SunraClientImpl(ClientConfig.builder().withProxyUrl(proxyUrl).build());
    }
}

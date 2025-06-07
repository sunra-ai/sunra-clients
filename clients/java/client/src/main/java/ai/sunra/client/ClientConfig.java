package ai.sunra.client;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;

/**
 * The client config.
 */
public class ClientConfig {

    /**
     * The credentials resolver to use for the client.
     */
    private CredentialsResolver credentials;

    /**
     * The proxy URL to use for the client.
     */
    private String proxyUrl;

    /**
     * Get the credentials resolver to use for the client.
     *
     * @return The credentials resolver to use for the client.
     */
    @Nonnull
    public CredentialsResolver getCredentials() {
        return credentials;
    }

    /**
     * Get the proxy URL to use for the client.
     *
     * @return The proxy URL to use for the client.
     */
    @Nullable
    public String getProxyUrl() {
        return proxyUrl;
    }

    /**
     * Create a new builder instance.
     *
     * @return The builder instance.
     */
    public static Builder builder() {
        return new Builder().withCredentials(CredentialsResolver.fromEnv());
    }

    /**
     * Create a new client config with the given credentials resolver.
     *
     * @param credentials The credentials resolver to use for the client.
     * @return The client config.
     */
    public static ClientConfig withCredentials(CredentialsResolver credentials) {
        return builder().withCredentials(credentials).build();
    }

    /**
     * Create a new client config with the given proxy URL.
     *
     * @param proxyUrl The proxy URL to use for the client.
     * @return The client config.
     */
    public static ClientConfig withProxyUrl(String proxyUrl) {
        return builder().withProxyUrl(proxyUrl).build();
    }

    public static class Builder {

        /**
         * The credentials resolver to use for the client.
         */
        private final ClientConfig config = new ClientConfig();

        /**
         * Set the credentials resolver to use for the client.
         *
         * @param credentials The credentials resolver to use for the client.
         * @return The builder instance.
         */
        public Builder withCredentials(CredentialsResolver credentials) {
            config.credentials = credentials;
            return this;
        }

        /**
         * Set the proxy URL to use for the client.
         *
         * @param proxyUrl The proxy URL to use for the client.
         * @return The builder instance.
         */
        public Builder withProxyUrl(String proxyUrl) {
            config.proxyUrl = proxyUrl;
            return this;
        }

        /**
         * Build the client config.
         *
         * @return The client config.
         */
        public ClientConfig build() {
            return config;
        }
    }
}

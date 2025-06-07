package ai.sunra.client;

import java.util.function.Supplier;

/**
 * The credentials resolver.
 */
public interface CredentialsResolver extends Supplier<String> {

    /**
     * Create a new credentials resolver from an API key.
     *
     * @param apiKey The API key.
     */
    static CredentialsResolver fromApiKey(String apiKey) {
        return () -> apiKey;
    }

    /**
     * Create a new credentials resolver from the environment.
     *
     * @return The credentials resolver.
     */
    static CredentialsResolver fromEnv() {
        return () -> System.getenv("SUNRA_KEY");
    }
}

package ai.sunra.client;

import java.util.function.Supplier;

public interface CredentialsResolver extends Supplier<String> {
    static CredentialsResolver fromApiKey(String apiKey) {
        return () -> apiKey;
    }

    static CredentialsResolver fromEnv() {
        return () -> System.getenv("SUNRA_KEY");
    }
}

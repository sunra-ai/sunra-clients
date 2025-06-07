package ai.sunra.client;

import jakarta.annotation.Nonnull;
import java.util.Objects;

/**
 * Represents the output of a request. It contains the data and the {@code requestId}.
 * @param <T> the type of the data in the output
 */
public class Output<T> {

    /**
     * The data.
     */
    private final T data;

    /**
     * The request ID.
     */
    private final String requestId;

    /**
     * Create a new output.
     *
     * @param data The data.
     * @param requestId The request ID.
     */
    public Output(@Nonnull T data, @Nonnull String requestId) {
        this.data = Objects.requireNonNull(data);
        this.requestId = Objects.requireNonNull(requestId);
    }

    /**
     * Get the data.
     *
     * @return The data.
     */
    @Nonnull
    public T getData() {
        return data;
    }

    /**
     * Get the request ID.
     *
     * @return The request ID.
     */
    @Nonnull
    public String getRequestId() {
        return requestId;
    }
}

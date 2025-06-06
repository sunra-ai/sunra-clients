package ai.sunra.client;

import ai.sunra.client.queue.QueueStatus;
import com.google.gson.JsonObject;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import java.util.function.Consumer;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubscribeOptions<O> implements ApiOptions<O> {

    /**
     * The input.
     */
    @Nonnull
    private final Object input;

    /**
     * The webhook URL.
     */
    @Nullable
    private final String webhookUrl;

    /**
     * The result type.
     */
    @Nonnull
    private final Class<O> resultType;

    /**
     * The logs.
     */
    @Nullable
    private final Boolean logs;

    /**
     * The on queue update callback.
     */
    @Nullable
    private final Consumer<QueueStatus.StatusUpdate> onQueueUpdate;

    /**
     * Get the HTTP method.
     *
     * @return The HTTP method.
     */
    @Override
    public String getHttpMethod() {
        return "POST";
    }

    /**
     * Create a new subscribe options with the given input.
     *
     * @param input The input.
     * @return The subscribe options.
     */
    @Nonnull
    public static SubscribeOptions<JsonObject> withInput(@Nonnull Object input) {
        return withInput(input, JsonObject.class);
    }

    /**
     * Create a new subscribe options with the given input and result type.
     *
     * @param input The input.
     * @param resultType The result type.
     * @return The subscribe options.
     */
    @Nonnull
    public static <O> SubscribeOptions<O> withInput(@Nonnull Object input, @Nullable Class<O> resultType) {
        return SubscribeOptions.<O>builder().input(input).resultType(resultType).build();
    }
}

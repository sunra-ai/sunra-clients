package ai.sunra.client;

import com.google.gson.JsonObject;
import jakarta.annotation.Nonnull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunOptions<O> implements ApiOptions<O> {

    /**
     * The input.
     */
    private final Object input;

    /**
     * The HTTP method.
     */
    private final String httpMethod;

    /**
     * The result type.
     */
    private final Class<O> resultType;

    /**
     * Create a new run options.
     */
    public static <O> RunOptions<O> withInput(@Nonnull Object input, @Nonnull Class<O> resultType) {
        return RunOptions.<O>builder().input(input).resultType(resultType).build();
    }

    /**
     * Create a new run options with the given input.
     *
     * @param input The input.
     * @return The run options.
     */
    public static RunOptions<JsonObject> withInput(@Nonnull Object input) {
        return withInput(input, JsonObject.class);
    }
}

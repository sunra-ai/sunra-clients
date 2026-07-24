package ai.sunra.client.queue;

import ai.sunra.client.ApiOptions;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.Builder;
import lombok.Data;
import java.util.Map;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

@Data
@Builder
public class QueueSubmitOptions implements ApiOptions<QueueStatus.InQueue> {

    @Nonnull
    private final Object input;

    @Nullable
    private final String webhookUrl;

    @Nullable
    private final Map<String, Object> provider;

    @Nonnull
    private final Class<QueueStatus.InQueue> resultType = QueueStatus.InQueue.class;

    @Override
    public String getHttpMethod() {
        return "POST";
    }

    @Override
    public Object getInput() {
        if (provider == null) {
            return input;
        }
        final JsonElement serializedInput = new Gson().toJsonTree(input);
        final JsonObject body = serializedInput != null && serializedInput.isJsonObject()
                ? serializedInput.getAsJsonObject()
                : new JsonObject();
        body.add("provider", new Gson().toJsonTree(provider));
        return body;
    }

    public static QueueSubmitOptions withInput(@Nonnull Object input) {
        return QueueSubmitOptions.builder().input(input).build();
    }
}

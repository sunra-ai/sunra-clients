package ai.sunra.client.queue;

import ai.sunra.client.ApiOptions;
import com.google.gson.JsonNull;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QueueCancelOptions implements ApiOptions<QueueStatus> {

    @Nonnull
    private final JsonNull input = JsonNull.INSTANCE;

    @Nonnull
    private final String requestId;

    @Nullable
    private final Boolean logs;

    @Nonnull
    private final Class<QueueStatus> resultType = QueueStatus.class;

    @Override
    public String getHttpMethod() {
        return "PUT";
    }

    public static QueueCancelOptions withRequestId(@Nonnull String requestId) {
        return QueueCancelOptions.builder().requestId(requestId).build();
    }
}

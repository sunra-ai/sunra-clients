package ai.sunra.client.queue;

import ai.sunra.client.exception.PredictionError;
import ai.sunra.client.exception.SunraException;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.annotations.SerializedName;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

public interface QueueStatus {

    enum Status {
        IN_QUEUE,
        IN_PROGRESS,
        COMPLETED,
        CANCELED,
    }

    interface StatusUpdate {
        @Nonnull
        Status getStatus();

        @Nonnull
        String getRequestId();

        @Nonnull
        String getStatusUrl();

        @Nonnull
        String getResponseUrl();

        @Nonnull
        String getCancelUrl();
    }

    @Data
    @NoArgsConstructor
    class BaseStatusUpdate implements StatusUpdate {

        @Nonnull
        protected Status status;

        @Nonnull
        @SerializedName("request_id")
        protected String requestId;

        @Nonnull
        @SerializedName("status_url")
        protected String statusUrl;

        @Nonnull
        @SerializedName("response_url")
        protected String responseUrl;

        @Nonnull
        @SerializedName("cancel_url")
        protected String cancelUrl;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @ToString(callSuper = true)
    class InQueue extends BaseStatusUpdate {

        @Nonnull
        @SerializedName("queue_position")
        private Integer queuePosition;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @ToString(callSuper = true)
    class InProgress extends BaseStatusUpdate {

        @Nullable
        @SerializedName("logs")
        private String logs;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @ToString(callSuper = true)
    class Completed extends BaseStatusUpdate {

        @Nullable
        @SerializedName("logs")
        private String logs;

        @SerializedName("success")
        private boolean success = true;

        @Nullable
        @SerializedName("error")
        private JsonElement error;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @ToString(callSuper = true)
    class CANCELED extends BaseStatusUpdate {

        @Nullable
        @SerializedName("logs")
        private String logs;
    }

    /**
     * Build the exception for a status that came back {@code success: false}
     * (SUNRA-819 Phase 4).
     *
     * <p>ONE parser, called by both the synchronous and the asynchronous queue
     * client. It replaces four hand-rolled copies of the same
     * {@code errorObject.has("x")} ladder which had already drifted apart: the
     * async pair read {@code details} with {@code getAsString()}, which throws
     * on the object-valued details the API actually sends, and dropped
     * {@code type} altogether.
     *
     * <p>The fields it produces are the same ones the queue result endpoint
     * produces from a {@code PREDICTION_FAILED} body, so the two ways of
     * learning that a prediction failed cannot disagree about what the failure
     * was.
     *
     * @param completed the failed status update
     * @param requestId the prediction's request id
     * @return the exception to fail the caller with
     */
    static SunraException toException(@Nonnull Completed completed, @Nullable String requestId) {
        final var predictionError = PredictionError.fromJson(completed.getError());
        if (predictionError != null) {
            // There is no response envelope on this path, so `getTimestamp()`
            // carries the failure time — which is what its javadoc promises and
            // what the JS and Python SDKs already do on their status paths.
            // Passing null here would make Java the odd one out and contradict
            // our own documentation, while the API had handed us the time.
            return SunraException.fromPredictionError(
                    predictionError, requestId, predictionError.getTimestamp(), null);
        }
        return new SunraException("Request failed", requestId);
    }

    static Class<? extends StatusUpdate> resolveType(JsonObject payload) {
        final var status = payload.get("status").getAsString();
        if (status.equals(QueueStatus.Status.IN_QUEUE.name())) {
            return InQueue.class;
        }
        if (status.equals(QueueStatus.Status.IN_PROGRESS.name())) {
            return QueueStatus.InProgress.class;
        }
        if (status.equals(QueueStatus.Status.COMPLETED.name())) {
            return QueueStatus.Completed.class;
        }
        if (status.equals(QueueStatus.Status.CANCELED.name())) {
            return QueueStatus.CANCELED.class;
        }
        throw new IllegalArgumentException("Unknown status: " + status);
    }
}

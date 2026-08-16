package ai.sunra.client.exception;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import jakarta.annotation.Nullable;
import java.util.HashMap;
import java.util.Map;

/**
 * Why a prediction ended in {@code status: "failed"} — the Sunra prediction
 * error contract v2 (SUNRA-819).
 *
 * <p>The same object appears on the queue status endpoint, on the SSE stream,
 * on failed-prediction webhooks, and — since Phase 4 — inside {@code
 * error.details} of the {@code PREDICTION_FAILED} body that
 * {@code GET /queue/requests/:id} returns for a failed prediction.
 *
 * <p><strong>{@code code} and {@code reason} are open sets.</strong> New values
 * ship without a breaking-change announcement, so never switch exhaustively on
 * either: treat an unrecognised {@code reason} as absent and an unrecognised
 * {@code code} as {@code internal_server_error}. Sunra also emits the sentinel
 * {@code unknown_error_code} for a failure it could recover no classification
 * for.
 *
 * <p>This type exists as much to remove duplication as to model the contract:
 * before it, the same hand-rolled {@code errorObject.has("x")} ladder was
 * written out four times across the sync and async queue clients, and the four
 * copies had already drifted (the async pair read {@code details} as a String,
 * which throws on an object-valued details, and dropped {@code type}
 * altogether). One parser, one place to extend.
 *
 * @see <a href="https://platform.sunra.ai/platform/errors">Prediction failure codes</a>
 */
public final class PredictionError {

    private final String code;

    private final String message;

    @Nullable
    private final String reason;

    @Nullable
    private final Boolean retryable;

    @Nullable
    private final String timestamp;

    public PredictionError(
            String code,
            String message,
            @Nullable String reason,
            @Nullable Boolean retryable,
            @Nullable String timestamp) {
        this.code = code;
        this.message = message;
        this.reason = reason;
        this.retryable = retryable;
        this.timestamp = timestamp;
    }

    /**
     * Parse a prediction error out of arbitrary JSON, or return {@code null}.
     *
     * <p>A guard, not a cast. This is handed the free-form {@code error} field
     * of a queue status and the free-form {@code details} of an API error
     * envelope, so a shape it does not recognise has to fall through to the
     * generic path rather than crash or produce a half-built error.
     *
     * <p>{@code code} and {@code message} must both be present JSON strings.
     * The optional fields are dropped individually when wrongly typed —
     * nothing here coerces, and nothing is invented: an absent
     * {@code retryable} means the API published no authoritative answer, and
     * deriving one from {@code code} would dress a guess up as its word.
     *
     * @param element the JSON to inspect; may be null or any JSON type
     * @return the parsed error, or null if this is not a v2 prediction error
     */
    @Nullable
    public static PredictionError fromJson(@Nullable JsonElement element) {
        if (element == null || element.isJsonNull() || !element.isJsonObject()) {
            return null;
        }
        final var object = element.getAsJsonObject();
        final var code = readString(object, "code");
        final var message = readString(object, "message");
        if (code == null || message == null) {
            return null;
        }
        return new PredictionError(
                code, message, readString(object, "reason"), readBoolean(object, "retryable"),
                readString(object, "timestamp"));
    }

    @Nullable
    private static String readString(JsonObject object, String key) {
        if (!object.has(key)) {
            return null;
        }
        final var element = object.get(key);
        if (!(element instanceof JsonPrimitive) || !element.getAsJsonPrimitive().isString()) {
            return null;
        }
        final var value = element.getAsString();
        return value.isEmpty() ? null : value;
    }

    @Nullable
    private static Boolean readBoolean(JsonObject object, String key) {
        if (!object.has(key)) {
            return null;
        }
        final var element = object.get(key);
        if (!(element instanceof JsonPrimitive) || !element.getAsJsonPrimitive().isBoolean()) {
            return null;
        }
        return element.getAsBoolean();
    }

    /** Coarse classification. Open set; never string-match {@code message} instead. */
    public String getCode() {
        return code;
    }

    /** Human-readable, and explicitly NOT parse-stable. Do not match on it. */
    public String getMessage() {
        return message;
    }

    /**
     * Machine-readable fine-grained cause ({@code input_fetch_failed},
     * {@code moderation_blocked}, {@code provider_rate_limited}, …), or null
     * when the failure was never classified. Absence carries no meaning of its
     * own.
     */
    @Nullable
    public String getReason() {
        return reason;
    }

    /**
     * Whether replaying the <em>same</em> input unchanged could succeed.
     * Authoritative when present, and independent of {@code code}: the same
     * {@code code} can be retryable in one failure and not in another. Null
     * means the API gave no answer — fall back to the documented per-code
     * default.
     */
    @Nullable
    public Boolean getRetryable() {
        return retryable;
    }

    /**
     * When the prediction failed (ISO 8601), or null for a row that recorded
     * no end time.
     *
     * <p>This is a <em>different</em> envelope from
     * {@link SunraException#getTimestamp()}, which is the time of the HTTP
     * error response that carried the failure. On a {@code result()} call for
     * a prediction that failed days ago the two are days apart.
     */
    @Nullable
    public String getTimestamp() {
        return timestamp;
    }

    /** Map representation, mirroring the wire shape. Absent fields stay absent. */
    public Map<String, Object> toMap() {
        final Map<String, Object> map = new HashMap<>();
        map.put("code", code);
        map.put("message", message);
        if (reason != null) map.put("reason", reason);
        if (retryable != null) map.put("retryable", retryable);
        if (timestamp != null) map.put("timestamp", timestamp);
        return map;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof PredictionError)) return false;
        final var that = (PredictionError) other;
        return java.util.Objects.equals(code, that.code)
                && java.util.Objects.equals(message, that.message)
                && java.util.Objects.equals(reason, that.reason)
                && java.util.Objects.equals(retryable, that.retryable)
                && java.util.Objects.equals(timestamp, that.timestamp);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(code, message, reason, retryable, timestamp);
    }

    @Override
    public String toString() {
        return "PredictionError{code=" + code
                + ", reason=" + reason
                + ", retryable=" + retryable
                + ", timestamp=" + timestamp
                + ", message=" + message
                + "}";
    }
}

package ai.sunra.client.exception;

import static java.util.Objects.requireNonNull;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when Sunra API operations fail.
 * Provides detailed error information including error codes, messages, details, and timestamps.
 */
public class SunraException extends RuntimeException {

    @Nullable
    private final String requestId;

    @Nullable
    private final String code;

    @Nullable
    private final String type;

    @Nullable
    private final Object details;

    @Nullable
    private final String timestamp;

    @Nullable
    private final RateLimitInfo rateLimit;

    /**
     * Fine-grained machine-readable cause of a prediction failure (SUNRA-819).
     * Open set — tolerate values you do not recognise.
     */
    @Nullable
    private final String reason;

    /**
     * Whether replaying the same input unchanged could succeed. Authoritative
     * when present and independent of {@code code}; {@code null} means the API
     * published no answer and this SDK will not invent one.
     */
    @Nullable
    private final Boolean retryable;

    /**
     * The prediction error as its own envelope, when this exception describes
     * a failed prediction.
     *
     * <p>It lives alongside the promoted {@code code} / {@code reason} /
     * {@code retryable} fields because the two envelopes each own a
     * {@code timestamp} and they mean different things — see
     * {@link #getTimestamp()}.
     */
    @Nullable
    private final PredictionError predictionError;

    /**
     * Create a new SunraException with basic message and request ID.
     *
     * @param message The error message
     * @param requestId The request ID associated with the error
     */
    public SunraException(@Nonnull String message, @Nullable String requestId) {
        super(requireNonNull(message));
        this.requestId = requestId;
        this.code = null;
        this.type = null;
        this.details = null;
        this.timestamp = null;
        this.rateLimit = null;
        this.reason = null;
        this.retryable = null;
        this.predictionError = null;
    }

    /**
     * Create a new SunraException with detailed error information.
     *
     * @param message The error message
     * @param code The error code
     * @param details Additional error details
     * @param timestamp The timestamp when the error occurred
     * @param requestId The request ID associated with the error
     * @deprecated Use the enhanced constructor with type and rate limit info
     */
    @Deprecated
    public SunraException(
            @Nonnull String message,
            @Nullable String code,
            @Nullable String details,
            @Nullable String timestamp,
            @Nullable String requestId) {
        super(requireNonNull(message));
        this.requestId = requestId;
        this.code = code;
        this.type = null;
        this.details = details;
        this.timestamp = timestamp;
        this.rateLimit = null;
        this.reason = null;
        this.retryable = null;
        this.predictionError = null;
    }

    /**
     * Create a new SunraException with enhanced error information.
     *
     * @param message The error message
     * @param code The error code
     * @param type The error type
     * @param details Additional error details
     * @param timestamp The timestamp when the error occurred
     * @param requestId The request ID associated with the error
     * @param rateLimit Rate limit information
     */
    public SunraException(
            @Nonnull String message,
            @Nullable String code,
            @Nullable String type,
            @Nullable Object details,
            @Nullable String timestamp,
            @Nullable String requestId,
            @Nullable RateLimitInfo rateLimit) {
        super(requireNonNull(message));
        this.requestId = requestId;
        this.code = code;
        this.type = type;
        this.details = details;
        this.timestamp = timestamp;
        this.rateLimit = rateLimit;
        this.reason = null;
        this.retryable = null;
        this.predictionError = null;
    }

    /**
     * Create a new SunraException carrying the prediction error contract v2
     * (SUNRA-819 Phase 4).
     *
     * <p>Used on the two paths that can learn <em>why a prediction failed</em>:
     * the {@code PREDICTION_FAILED} body of the queue result endpoint, and a
     * failed queue status arriving through {@code subscribeToStatus}. Both
     * produce the same fields, so the two ways of finding out cannot disagree.
     *
     * @param message The error message
     * @param code The error code
     * @param type The error type
     * @param details Additional error details
     * @param timestamp The timestamp of the API RESPONSE envelope — not the
     *     prediction failure time, which is on {@code predictionError}
     * @param requestId The request ID associated with the error
     * @param rateLimit Rate limit information
     * @param reason The v2 fine-grained cause, or null when unclassified
     * @param retryable The v2 retry verdict, or null when the API gave none
     * @param predictionError The whole prediction error envelope, or null
     */
    public SunraException(
            @Nonnull String message,
            @Nullable String code,
            @Nullable String type,
            @Nullable Object details,
            @Nullable String timestamp,
            @Nullable String requestId,
            @Nullable RateLimitInfo rateLimit,
            @Nullable String reason,
            @Nullable Boolean retryable,
            @Nullable PredictionError predictionError) {
        super(requireNonNull(message));
        this.requestId = requestId;
        this.code = code;
        this.type = type;
        this.details = details;
        this.timestamp = timestamp;
        this.rateLimit = rateLimit;
        this.reason = reason;
        this.retryable = retryable;
        this.predictionError = predictionError;
    }

    /**
     * Create a new SunraException from a prediction that ended in
     * {@code status: "failed"}.
     *
     * <p>The v2 object's own fields become the exception's first-class fields
     * (r4-B2), so a caller reads {@code getCode()} / {@code getReason()} /
     * {@code getRetryable()} directly instead of digging through
     * {@code getDetailsObject()} — and the whole object is kept too, because
     * only it can say unambiguously when the prediction failed.
     *
     * @param predictionError The prediction error, never null
     * @param requestId The request ID associated with the error
     * @param responseTimestamp The API response envelope's timestamp, or null
     *     when the error came from a status poll rather than an HTTP error
     * @param rateLimit Rate limit information
     */
    public static SunraException fromPredictionError(
            @Nonnull PredictionError predictionError,
            @Nullable String requestId,
            @Nullable String responseTimestamp,
            @Nullable RateLimitInfo rateLimit) {
        requireNonNull(predictionError);
        return new SunraException(
                predictionError.getMessage(),
                predictionError.getCode(),
                "prediction_failed",
                predictionError.toMap(),
                responseTimestamp,
                requestId,
                rateLimit,
                predictionError.getReason(),
                predictionError.getRetryable(),
                predictionError);
    }

    /**
     * Create a new SunraException with basic message, cause, and request ID.
     *
     * @param message The error message
     * @param cause The underlying cause
     * @param requestId The request ID associated with the error
     */
    public SunraException(@Nonnull String message, @Nonnull Throwable cause, @Nullable String requestId) {
        super(requireNonNull(message), cause);
        this.requestId = requestId;
        this.code = null;
        this.type = null;
        this.details = null;
        this.timestamp = null;
        this.rateLimit = null;
        this.reason = null;
        this.retryable = null;
        this.predictionError = null;
    }

    /**
     * Create a new SunraException with detailed error information and cause.
     *
     * @param message The error message
     * @param code The error code
     * @param details Additional error details
     * @param timestamp The timestamp when the error occurred
     * @param cause The underlying cause
     * @param requestId The request ID associated with the error
     * @deprecated Use the enhanced constructor with type and rate limit info
     */
    @Deprecated
    public SunraException(
            @Nonnull String message,
            @Nullable String code,
            @Nullable String details,
            @Nullable String timestamp,
            @Nonnull Throwable cause,
            @Nullable String requestId) {
        super(requireNonNull(message), cause);
        this.requestId = requestId;
        this.code = code;
        this.type = null;
        this.details = details;
        this.timestamp = timestamp;
        this.rateLimit = null;
        this.reason = null;
        this.retryable = null;
        this.predictionError = null;
    }

    /**
     * Create a new SunraException from a throwable cause.
     *
     * @param cause The underlying cause
     */
    public SunraException(Throwable cause) {
        super(cause);
        this.requestId = null;
        this.code = null;
        this.type = null;
        this.details = null;
        this.timestamp = null;
        this.rateLimit = null;
        this.reason = null;
        this.retryable = null;
        this.predictionError = null;
    }

    /**
     * Get the request ID associated with this error.
     *
     * @return The request ID, or null if not available
     */
    @Nullable
    public String getRequestId() {
        return this.requestId;
    }

    /**
     * Get the error code.
     *
     * @return The error code, or null if not available
     */
    @Nullable
    public String getCode() {
        return this.code;
    }

    /**
     * Get additional error details.
     *
     * @return Additional error details, or null if not available
     */
    @Nullable
    public Object getDetailsObject() {
        return this.details;
    }

    /**
     * Get additional error details as string (legacy method).
     *
     * @return Additional error details as string, or null if not available
     * @deprecated Use getDetailsObject() instead
     */
    @Deprecated
    @Nullable
    public String getDetails() {
        return this.details != null ? this.details.toString() : null;
    }

    /**
     * Get the error type.
     *
     * @return The error type, or null if not available
     */
    @Nullable
    public String getType() {
        return this.type;
    }

    /**
     * Get the timestamp of the API <strong>response</strong> envelope — the
     * outer of the two envelopes.
     *
     * <p>For a failed prediction fetched through {@code result()} this is when
     * the HTTP error was produced, NOT when the prediction failed; that one is
     * {@code getPredictionError().getTimestamp()} and can be days earlier.
     * (Exceptions built straight from a queue status carry the failure time
     * here, because that path has no response envelope of its own — which is
     * exactly why the unambiguous field exists.)
     *
     * @return The timestamp, or null if not available
     */
    @Nullable
    public String getTimestamp() {
        return this.timestamp;
    }

    /**
     * Get the fine-grained machine-readable cause of a prediction failure.
     *
     * <p>Open set (SUNRA-819): treat a value you do not recognise as absent
     * rather than rejecting the response.
     *
     * @return The reason, or null when the failure was never classified
     */
    @Nullable
    public String getReason() {
        return this.reason;
    }

    /**
     * Get whether replaying the same input unchanged could succeed.
     *
     * <p>Authoritative when non-null and independent of {@link #getCode()}.
     * {@code null} means the API published no answer — fall back to the
     * documented per-code default rather than guessing.
     *
     * @return The retry verdict, or null when the API gave none
     */
    @Nullable
    public Boolean getRetryable() {
        return this.retryable;
    }

    /**
     * Get the prediction error envelope, when this exception describes a
     * failed prediction.
     *
     * <p>Read {@code getPredictionError().getTimestamp()} whenever you mean
     * the time the prediction failed; {@link #getTimestamp()} is the response
     * envelope's own time.
     *
     * @return The prediction error, or null if this is not a prediction failure
     */
    @Nullable
    public PredictionError getPredictionError() {
        return this.predictionError;
    }

    /**
     * Get the rate limit information.
     *
     * @return The rate limit info, or null if not available
     */
    @Nullable
    public RateLimitInfo getRateLimit() {
        return this.rateLimit;
    }

    /**
     * Convert error to map format matching API response structure.
     *
     * @return Map representation of the error
     */
    public Map<String, Object> toMap() {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> error = new HashMap<>();
        error.put("code", code != null ? code : "UNKNOWN_ERROR");
        error.put("message", getMessage());
        if (type != null) error.put("type", type);
        // Null-checked, not truthiness: `retryable == false` is a real answer
        // and must serialize; null means "the API said nothing".
        if (reason != null) error.put("reason", reason);
        if (retryable != null) error.put("retryable", retryable);
        if (details != null) error.put("details", details);
        result.put("error", error);

        if (timestamp != null) result.put("timestamp", timestamp);
        if (requestId != null) result.put("request_id", requestId);
        if (rateLimit != null) result.put("rate_limit", rateLimit.toMap());

        return result;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(getMessage());

        if (code != null) {
            sb.append(" | Code: ").append(code);
        }

        if (type != null) {
            sb.append(" | Type: ").append(type);
        }

        if (reason != null) {
            sb.append(" | Reason: ").append(reason);
        }

        if (retryable != null) {
            sb.append(" | Retryable: ").append(retryable);
        }

        if (details != null && !details.equals(getMessage())) {
            sb.append(" | Details: ").append(details);
        }

        if (timestamp != null) {
            sb.append(" | Timestamp: ").append(timestamp);
        }

        if (requestId != null) {
            sb.append(" | Request ID: ").append(requestId);
        }

        return sb.toString();
    }

    /**
     * Rate limit information extracted from response headers.
     */
    public static class RateLimitInfo {
        private final int limit;
        private final int remaining;
        private final int reset;

        public RateLimitInfo(int limit, int remaining, int reset) {
            this.limit = limit;
            this.remaining = remaining;
            this.reset = reset;
        }

        public int getLimit() { return limit; }
        public int getRemaining() { return remaining; }
        public int getReset() { return reset; }

        public Map<String, Integer> toMap() {
            Map<String, Integer> map = new HashMap<>();
            map.put("limit", limit);
            map.put("remaining", remaining);
            map.put("reset", reset);
            return map;
        }
    }
}

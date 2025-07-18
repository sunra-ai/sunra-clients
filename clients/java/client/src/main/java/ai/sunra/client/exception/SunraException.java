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
     * Get the timestamp when the error occurred.
     *
     * @return The timestamp, or null if not available
     */
    @Nullable
    public String getTimestamp() {
        return this.timestamp;
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

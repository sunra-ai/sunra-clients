package ai.sunra.client.exception;

import static java.util.Objects.requireNonNull;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;

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
    private final String details;

    @Nullable
    private final String timestamp;

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
        this.details = null;
        this.timestamp = null;
    }

    /**
     * Create a new SunraException with detailed error information.
     *
     * @param message The error message
     * @param code The error code
     * @param details Additional error details
     * @param timestamp The timestamp when the error occurred
     * @param requestId The request ID associated with the error
     */
    public SunraException(
            @Nonnull String message,
            @Nullable String code,
            @Nullable String details,
            @Nullable String timestamp,
            @Nullable String requestId) {
        super(requireNonNull(message));
        this.requestId = requestId;
        this.code = code;
        this.details = details;
        this.timestamp = timestamp;
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
        this.details = null;
        this.timestamp = null;
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
     */
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
        this.details = details;
        this.timestamp = timestamp;
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
        this.details = null;
        this.timestamp = null;
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
    public String getDetails() {
        return this.details;
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

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(getMessage());

        if (code != null) {
            sb.append(" | Code: ").append(code);
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
}

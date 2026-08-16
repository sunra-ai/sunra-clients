import type { SunraPredictionError } from './types'

export interface SunraErrorDetails {
    [key: string]: any
}

export interface SunraRateLimit {
    limit: number
    remaining: number
    reset: number
}

// Type-only import: `types.ts` imports `SunraError` back for its `onError`
// callback, so a value import here would be a runtime cycle. `import type` is
// erased at compile time, so this one is not.
export type { SunraPredictionError }

/**
 * Collapse anything that could forge a log record or drive a terminal.
 *
 * `toString()` is a human-readable, newline-delimited sink: a `reason` or
 * `message` carrying `\n` can append what looks like a second, independent log
 * entry, and ANSI escapes can rewrite what a reader sees. Neither field is ours
 * — `message` is upstream provider text and both arrive over a connection the
 * caller may have pointed at a proxy — so neither is trusted here.
 *
 * Display only: `.message`, `.reason` and `.predictionError` keep the exact
 * bytes the API sent, because they are the structured contract.
 */
function forLogLine(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
}

/**
 * Standard error class for all Sunra API operations.
 * Provides consistent error structure across all SDKs.
 */
export class SunraError extends Error {
    public readonly type?: string
    public readonly code: string
    public readonly details?: SunraErrorDetails
    /**
     * Time of the API **response** envelope that carried this error — the
     * outer of the two envelopes. For a failed prediction retrieved through
     * `result()`, this is when the HTTP error was produced, NOT when the
     * prediction failed; the failure time is `predictionError.timestamp`, and
     * on a prediction that failed days ago the two are days apart.
     *
     * (Errors built straight from a queue status carry the failure time here,
     * because that path has no response envelope of its own. Read
     * `predictionError.timestamp` whenever you mean the failure time — it is
     * unambiguous on every path.)
     */
    public readonly timestamp?: string
    public readonly requestId?: string
    public readonly rateLimit?: SunraRateLimit
    /**
     * Fine-grained machine-readable cause of a prediction failure. Open set —
     * tolerate values you do not recognise (SUNRA-819).
     */
    public readonly reason?: string
    /**
     * Whether replaying the same input unchanged could succeed. Authoritative
     * when present and independent of `code`; when absent, fall back to the
     * documented per-code default. **Never derived by this SDK** — an absent
     * value means the API declined to answer, and inventing one here would
     * publish a guess as though it were the API's word.
     */
    public readonly retryable?: boolean
    /**
     * The prediction error object as its own envelope, whenever this error
     * describes a failed prediction.
     *
     * It exists alongside the promoted `code` / `reason` / `retryable` fields
     * because the two envelopes each own a `timestamp` and they mean different
     * things (see `timestamp` above). Modelling them separately is what keeps
     * a `result()` rejection honest about both.
     */
    public readonly predictionError?: SunraPredictionError

    constructor(options: {
        message: string
        type?: string
        code: string
        details?: SunraErrorDetails
        timestamp?: string
        requestId?: string
        rateLimit?: SunraRateLimit
        reason?: string
        retryable?: boolean
        predictionError?: SunraPredictionError
    }) {
        super(options.message)
        this.name = 'SunraError'
        this.type = options.type
        this.code = options.code
        this.details = options.details
        this.timestamp = options.timestamp
        this.requestId = options.requestId
        this.rateLimit = options.rateLimit
        this.reason = options.reason
        this.retryable = options.retryable
        this.predictionError = options.predictionError

        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, SunraError.prototype)
    }

    /**
     * Convert error to JSON format matching API response structure
     */
    toJSON() {
        const result: any = {
            error: {
                ...(this.type && { type: this.type }),
                code: this.code,
                message: this.message,
                // Only emitted when the API actually said so — `undefined` is
                // a real answer here ("no authoritative value"), and must not
                // be serialized as a key at all.
                ...(this.reason !== undefined && { reason: this.reason }),
                ...(this.retryable !== undefined && { retryable: this.retryable }),
                ...(this.details && { details: this.details })
            }
        }

        if (this.timestamp) result.timestamp = this.timestamp
        if (this.requestId) result.request_id = this.requestId
        if (this.rateLimit) result.rate_limit = this.rateLimit

        return result
    }

    /**
     * Create a string representation of the error for logging
     */
    toString(): string {
        const parts: string[] = []

        if (this.code) parts.push(`[${this.code}]`)
        if (this.reason) parts.push(`(${this.reason})`)
        if (this.message) parts.push(this.message)
        if (this.retryable !== undefined) {
            parts.push(this.retryable ? '[retryable]' : '[not retryable]')
        }
        if (this.requestId) parts.push(`(Request: ${this.requestId})`)

        return forLogLine(parts.join(' '))
    }
}

/**
 * Specialized error class for network-level errors (HTTP errors, timeouts, etc.)
 */
export class SunraNetworkError extends SunraError {
    public readonly statusCode: number
    public readonly responseBody: string

    constructor(
        statusCode: number,
        responseBody: string,
        requestId?: string,
        rateLimit?: SunraRateLimit
    ) {
        super({
            message: `HTTP ${statusCode}: ${responseBody || 'Request failed'}`,
            type: 'network_error',
            code: `HTTP_${statusCode}`,
            details: { statusCode, responseBody },
            requestId,
            rateLimit
        })
        this.statusCode = statusCode
        this.responseBody = responseBody

        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, SunraNetworkError.prototype)
    }
}

/**
 * Type guard to check if an error is a SunraError
 */
export function isSunraError(error: any): error is SunraError {
    return error instanceof SunraError
}

/**
 * Type guard to check if an error is a SunraNetworkError
 */
export function isSunraNetworkError(error: any): error is SunraNetworkError {
    return error instanceof SunraNetworkError
}

export interface SunraErrorDetails {
    [key: string]: any
}

export interface SunraRateLimit {
    limit: number
    remaining: number
    reset: number
}

/**
 * Standard error class for all Sunra API operations.
 * Provides consistent error structure across all SDKs.
 */
export class SunraError extends Error {
    public readonly type?: string
    public readonly code: string
    public readonly details?: SunraErrorDetails
    public readonly timestamp?: string
    public readonly requestId?: string
    public readonly rateLimit?: SunraRateLimit

    constructor(options: {
        message: string
        type?: string
        code: string
        details?: SunraErrorDetails
        timestamp?: string
        requestId?: string
        rateLimit?: SunraRateLimit
    }) {
        super(options.message)
        this.name = 'SunraError'
        this.type = options.type
        this.code = options.code
        this.details = options.details
        this.timestamp = options.timestamp
        this.requestId = options.requestId
        this.rateLimit = options.rateLimit

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
        if (this.message) parts.push(this.message)
        if (this.requestId) parts.push(`(Request: ${this.requestId})`)

        return parts.join(' ')
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

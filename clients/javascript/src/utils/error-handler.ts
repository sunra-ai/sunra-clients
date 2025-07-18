import { SunraError, SunraNetworkError, SunraRateLimit } from '../errors'
import { whisper } from '../utils'

/**
 * Extract rate limit information from response headers
 */
function extractRateLimitFromHeaders(headers: any): SunraRateLimit | undefined {
  const limit = headers?.['x-ratelimit-limit']
  const remaining = headers?.['x-ratelimit-remaining']
  const reset = headers?.['x-ratelimit-reset']

  if (limit !== undefined && remaining !== undefined && reset !== undefined) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10)
    }
  }

  return undefined
}

/**
 * Extract standardized error information from various error sources
 * This is the main error standardization function that handles:
 * - Axios HTTP errors with business logic error responses
 * - Network errors (timeouts, connection issues)
 * - Internal SDK errors
 */
export function extractSunraError(error: any): SunraError {
  // Handle axios errors
  whisper('error is: ', error)
  whisper('error.response is: ', error?.response)
  if (error.isAxiosError || error.response) {
    const response = error.response
    const requestId = response?.headers?.['x-request-id']
    const rateLimit = extractRateLimitFromHeaders(response?.headers)

    if (response?.data) {
      // Try to extract business error from structured API response
      const data = response.data

      if (data.error && typeof data.error === 'object') {
        // Standard API error format with nested error object
        return new SunraError({
          message: data.error.message || 'Request failed',
          type: data.error.type,
          code: data.error.code || `HTTP_${response.status}`,
          details: data.error.details,
          timestamp: data.timestamp,
          requestId: requestId,
          rateLimit: rateLimit
        })
      }

      // Fallback to top-level fields for legacy responses
      if (data.message || data.detail) {
        return new SunraError({
          message: data.message || data.detail || 'Request failed',
          code: data.code || `HTTP_${response.status}`,
          type: data.type,
          details: typeof data === 'object' ? data : { raw: data },
          timestamp: data.timestamp,
          requestId: requestId,
          rateLimit: rateLimit
        })
      }
    }

    // Create network error for HTTP errors without structured business error data
    if (response?.status) {
      return new SunraNetworkError(
        response?.status,
        error.message || response?.statusText || 'Unknown error',
        requestId,
        rateLimit
      )
    } else {
      return new SunraError(
        {
          message: error.message || 'Unknown error',
          code: error.code || 'unknown',
          type: error.type || 'network_error',
          timestamp: error.timestamp,
        }
      )
    }
  }

  // Handle already converted SunraError instances (pass-through)
  if (error instanceof SunraError) {
    return error
  }

  // Handle internal errors (SDK bugs, network timeouts, etc.)
  return new SunraError({
    message: error.message || 'Unknown error',
    code: 'unknown',
    type: 'unknown',
    details: { stack: error.stack, name: error.name }
  })
}

/**
 * Legacy error extraction for backward compatibility
 * @deprecated Use extractSunraError instead
 */
export function extractErrorData(error: any): any {
  if (error.response?.data) {
    return error.response.data
  }
  return error
}

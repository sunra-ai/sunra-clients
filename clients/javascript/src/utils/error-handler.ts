import { SunraError, SunraNetworkError, SunraRateLimit } from '../errors'
import type { SunraPredictionError } from '../types'
import { whisper } from '../utils'

/**
 * Error code the queue result endpoint returns when the prediction it was
 * asked for ended in `status: "failed"` (SUNRA-819 Phase 4). Stable, and the
 * only marker that says "`details` is a prediction error object, not an
 * opaque bag".
 */
export const PREDICTION_FAILED_CODE = 'PREDICTION_FAILED'

/**
 * Recognise the v2 prediction error inside `error.details`.
 *
 * A runtime guard rather than a cast, because `details` is a free-form field
 * on every other error this API returns: a malformed or unexpected payload has
 * to fall back to the generic path, never crash the SDK and never fabricate a
 * half-built prediction error. `code` and `message` must both be present and
 * be strings; `reason` / `retryable` / `timestamp` are optional and are
 * dropped individually if they arrive wrongly typed — nothing here coerces.
 */
export function asPredictionError(details: unknown): SunraPredictionError | undefined {
    if (typeof details !== 'object' || details === null || Array.isArray(details)) {
        return undefined
    }
    const candidate = details as Record<string, unknown>
    if (typeof candidate.code !== 'string' || typeof candidate.message !== 'string') {
        return undefined
    }
    const predictionError: SunraPredictionError = {
        code: candidate.code,
        message: candidate.message
    }
    if (typeof candidate.reason === 'string' && candidate.reason) {
        predictionError.reason = candidate.reason
    }
    if (typeof candidate.retryable === 'boolean') {
        predictionError.retryable = candidate.retryable
    }
    if (typeof candidate.timestamp === 'string' && candidate.timestamp) {
        predictionError.timestamp = candidate.timestamp
    }
    return predictionError
}

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
        // SUNRA-819 Phase 4: `GET /queue/requests/:id` on a FAILED prediction
        // answers with code PREDICTION_FAILED and the v2 prediction error in
        // `details`. Left to the generic path below, `details` stays an opaque
        // object and the caller gets `code: 'PREDICTION_FAILED'` — technically
        // correct, useless in practice: they would have to reach into
        // `details` by hand to learn WHY, and `result()` would reject with a
        // different shape than `subscribe()` does for the very same failure.
        //
        // So the v2 object is promoted to first-class fields, making the two
        // paths agree, and is ALSO kept whole on `predictionError` — because
        // both envelopes carry a `timestamp` and they are not the same instant
        // (r4-B3).
        const predictionError =
          data.error.code === PREDICTION_FAILED_CODE
            ? asPredictionError(data.error.details)
            : undefined

        if (predictionError) {
          return new SunraError({
            message: predictionError.message,
            type: 'prediction_failed',
            code: predictionError.code,
            reason: predictionError.reason,
            retryable: predictionError.retryable,
            details: data.error.details,
            predictionError,
            // The OUTER envelope's time — when the API answered. The failure
            // time lives on `predictionError.timestamp` and can be days older.
            timestamp: data.timestamp,
            requestId: requestId,
            rateLimit: rateLimit
          })
        }

        // Standard API error format with nested error object
        return new SunraError({
          message: data.error.message || 'Request failed',
          type: data.error.type,
          code: data.error.code || `HTTP_${response.status}`,
          details: data.error.details,
          // Forwarded, never synthesized: if the envelope ever carries these
          // directly they ride along; if it does not they stay absent rather
          // than being guessed from the status code.
          reason: typeof data.error.reason === 'string' ? data.error.reason : undefined,
          retryable: typeof data.error.retryable === 'boolean' ? data.error.retryable : undefined,
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

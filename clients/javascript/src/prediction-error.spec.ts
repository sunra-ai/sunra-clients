import { describe, expect, it } from 'vitest'
import { SunraError } from './errors'
import { asPredictionError, extractSunraError, PREDICTION_FAILED_CODE } from './utils/error-handler'
import type { SunraCompletedQueueStatus, SunraPredictionError } from './types'
import { createSunraClient } from './client'

/**
 * SUNRA-819 Phase 4 — the prediction error contract v2 in the JS SDK:
 * `reason` / `retryable` carried through, `timestamp` optional, and the
 * `PREDICTION_FAILED` body of `GET /queue/requests/:id` unpacked instead of
 * being handed back as an opaque `details` bag (plan §5 Phase 4, r4-B2/r4-B3).
 *
 * Every fixture below is a verbatim prod row (`sunra-prod.predictions`,
 * 2026-08-17 sweep). The two `reason`s that exist here are the only two with
 * live producers in prod.
 */

// pd_VEwnjvrLmVq5hzjpY5gUsNq4 (2026-08-14) — SUNRA-841 input-fetch class.
const PROD_INPUT_FETCH_FAILED: SunraPredictionError = {
  code: 'invalid_input',
  message:
    'Failed to fetch an input file (https://eae11ef1ce149104a83288cc3847b6fb.r2.cloudflarestorage.com/clawly-conductor-lab-artifacts/inbound/imsg_smoke_eng8643_20260803T042129Z_4...): HTTP 403.',
  reason: 'input_fetch_failed',
  retryable: false,
  timestamp: '2026-08-14T18:22:33.179Z',
}

// pd_a839exsaLNmVZzWvDaxAuapS (2026-08-14) — moderation class.
const PROD_MODERATION_BLOCKED: SunraPredictionError = {
  code: 'unsafe_content',
  message:
    'The prediction may contain sensitive or restricted content and has been suppressed. Please revise your input.',
  reason: 'moderation_blocked',
  retryable: false,
  timestamp: '2026-08-14T17:51:47.206Z',
}

// pd_Gf4L83a52tmeQBeqm2w4GdnQ — a pre-v2 row, still the bulk of the table:
// no reason, no retryable, and nothing may invent either.
const PROD_PRE_V2: SunraPredictionError = {
  code: 'service_provider_error',
  message: 'Predict failed. Please try again.',
}

/** The wire body `GET /queue/requests/:id` returns for a failed prediction. */
const predictionFailedBody = (error: SunraPredictionError) => ({
  error: {
    type: 'invalid_request_error',
    code: PREDICTION_FAILED_CODE,
    message: error.message,
    details: { ...error },
  },
  request_id: 'req_01JXQ2',
  // The OUTER envelope's own timestamp — when the API answered, not when the
  // prediction failed.
  timestamp: '2026-08-17T09:00:00.000Z',
  path: '/v1/queue/requests/pd_VEwnjvrLmVq5hzjpY5gUsNq4',
})

const axiosErrorWith = (data: unknown, status = 400) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: { status, data, headers: { 'x-request-id': 'req_01JXQ2' } },
})

describe('asPredictionError — a guard, not a cast', () => {
  it('recognises the prod v2 object', () => {
    expect(asPredictionError({ ...PROD_INPUT_FETCH_FAILED })).toEqual(
      PROD_INPUT_FETCH_FAILED,
    )
  })

  it('recognises a pre-v2 object without inventing reason or retryable', () => {
    const parsed = asPredictionError({ ...PROD_PRE_V2 })
    expect(parsed).toEqual(PROD_PRE_V2)
    expect(parsed).not.toHaveProperty('reason')
    expect(parsed).not.toHaveProperty('retryable')
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'boom'],
    ['an array', [{ code: 'a', message: 'b' }]],
    ['an object with no code', { message: 'b' }],
    ['an object with no message', { code: 'a' }],
    ['a non-string code', { code: 42, message: 'b' }],
    ['a non-string message', { code: 'a', message: ['b'] }],
  ])('falls back to the generic path for %s', (_name, details) => {
    expect(asPredictionError(details)).toBeUndefined()
  })

  it('drops wrongly-typed optional fields instead of coercing them', () => {
    const parsed = asPredictionError({
      code: 'invalid_input',
      message: 'x',
      reason: 42,
      retryable: 'false',
      timestamp: 0,
    })
    expect(parsed).toEqual({ code: 'invalid_input', message: 'x' })
  })

  it('drops an empty-string reason', () => {
    expect(asPredictionError({ code: 'a', message: 'b', reason: '' })).toEqual({
      code: 'a',
      message: 'b',
    })
  })
})

describe('extractSunraError — PREDICTION_FAILED is unpacked, not left opaque', () => {
  it('promotes the v2 object to first-class fields', () => {
    const error = extractSunraError(
      axiosErrorWith(predictionFailedBody(PROD_INPUT_FETCH_FAILED)),
    )

    expect(error).toBeInstanceOf(SunraError)
    // Not 'PREDICTION_FAILED': the caller wants to know WHY the prediction
    // failed, and this is the same code `subscribe()` surfaces.
    expect(error.code).toBe('invalid_input')
    expect(error.reason).toBe('input_fetch_failed')
    expect(error.retryable).toBe(false)
    expect(error.message).toBe(PROD_INPUT_FETCH_FAILED.message)
    expect(error.type).toBe('prediction_failed')
    expect(error.requestId).toBe('req_01JXQ2')
  })

  it('keeps the whole prediction error as its own envelope', () => {
    const error = extractSunraError(
      axiosErrorWith(predictionFailedBody(PROD_MODERATION_BLOCKED)),
    )
    expect(error.predictionError).toEqual(PROD_MODERATION_BLOCKED)
  })

  it('models the two timestamps separately (r4-B3)', () => {
    // The single assertion that stops someone "simplifying" the two envelopes
    // into one field: they are different instants and both are meaningful.
    const error = extractSunraError(
      axiosErrorWith(predictionFailedBody(PROD_INPUT_FETCH_FAILED)),
    )

    expect(error.timestamp).toBe('2026-08-17T09:00:00.000Z')
    expect(error.predictionError?.timestamp).toBe('2026-08-14T18:22:33.179Z')
    expect(error.timestamp).not.toBe(error.predictionError?.timestamp)
  })

  it('synthesizes neither reason nor retryable for a pre-v2 failure', () => {
    const error = extractSunraError(
      axiosErrorWith(predictionFailedBody(PROD_PRE_V2)),
    )

    expect(error.code).toBe('service_provider_error')
    expect(error.reason).toBeUndefined()
    expect(error.retryable).toBeUndefined()
    // ...and it does not leak into the serialized form either.
    expect(error.toJSON().error).not.toHaveProperty('reason')
    expect(error.toJSON().error).not.toHaveProperty('retryable')
  })

  it('leaves a non-prediction API error exactly as before', () => {
    const error = extractSunraError(
      axiosErrorWith(
        {
          error: {
            type: 'authorization_error',
            code: 'MODEL_ACCESS_DENIED',
            message: 'Access to the requested model is not allowed',
            details: { model: 'black-forest-labs/flux-1.1-pro' },
          },
          timestamp: '2026-08-17T09:00:00.000Z',
        },
        403,
      ),
    )

    expect(error.code).toBe('MODEL_ACCESS_DENIED')
    expect(error.type).toBe('authorization_error')
    expect(error.predictionError).toBeUndefined()
    expect(error.reason).toBeUndefined()
    expect(error.details).toEqual({ model: 'black-forest-labs/flux-1.1-pro' })
  })

  it('falls back to the generic path when details are not a v2 object', () => {
    // A PREDICTION_FAILED code with a malformed body must not crash and must
    // not half-build a prediction error.
    const error = extractSunraError(
      axiosErrorWith({
        error: {
          type: 'invalid_request_error',
          code: PREDICTION_FAILED_CODE,
          message: 'Something failed',
          details: 'not an object',
        },
      }),
    )

    expect(error.code).toBe(PREDICTION_FAILED_CODE)
    expect(error.predictionError).toBeUndefined()
    expect(error.message).toBe('Something failed')
  })
})

describe('SunraError — the v2 fields survive serialization', () => {
  it('emits reason and retryable inside the error envelope', () => {
    const error = new SunraError({ ...PROD_INPUT_FETCH_FAILED, type: 'prediction_failed' })
    expect(error.toJSON().error).toMatchObject({
      code: 'invalid_input',
      reason: 'input_fetch_failed',
      retryable: false,
    })
  })

  it('emits retryable: true rather than dropping it as falsy', () => {
    const error = new SunraError({
      code: 'internal_server_error',
      message: 'The prediction stalled and was terminated. Please retry.',
      reason: 'reaped_stalled',
      retryable: true,
    })
    expect(error.toJSON().error.retryable).toBe(true)
    // ...and the `false` case is a value too, not an absence.
    expect(
      new SunraError({ code: 'a', message: 'b', retryable: false }).toJSON()
        .error.retryable,
    ).toBe(false)
  })

  it('names the reason and the retry verdict in toString()', () => {
    expect(new SunraError(PROD_INPUT_FETCH_FAILED).toString()).toContain(
      '(input_fetch_failed)',
    )
    expect(new SunraError(PROD_INPUT_FETCH_FAILED).toString()).toContain(
      '[not retryable]',
    )
  })

  it('cannot be used to forge a second log record', () => {
    // `toString()` is newline-delimited, so a `reason` or `message` carrying
    // \n would append what reads as an independent entry — and ANSI escapes
    // would rewrite what a terminal shows. Neither field is ours: `message` is
    // upstream provider text, and both arrive over a connection the caller may
    // have pointed at a proxy.
    const error = new SunraError({
      code: 'invalid_input',
      message: 'boom\r\n[authorization_error] Request: victim',
      reason: 'input_fetch_failed\n\u001b[31mERROR: payment approved',
    })

    const rendered = error.toString()
    expect(rendered).not.toContain('\n')
    expect(rendered).not.toContain('\r')
    expect(rendered).not.toContain('\u001b')
    // ...and the structured fields still hold the exact bytes the API sent.
    expect(error.reason).toContain('\n')
    expect(error.message).toContain('\r\n')
  })

  it('accepts a prediction error with no timestamp at all', () => {
    // `timestamp` used to be required on the status type while the API never
    // sent one. It is optional now, and an error without it must construct.
    const error = new SunraError(PROD_PRE_V2)
    expect(error.timestamp).toBeUndefined()
    expect(error.toJSON()).not.toHaveProperty('timestamp')
  })
})

describe('result() on a failed prediction rejects with the failure (r4-B2)', () => {
  const clientWith = (respond: () => never | Promise<unknown>) =>
    createSunraClient({
      credentials: 'test-key',
      axios: { request: respond } as never,
    })

  it('rejects with the promoted v2 error, not an opaque details bag', async () => {
    const client = clientWith(() =>
      Promise.reject(
        axiosErrorWith(predictionFailedBody(PROD_INPUT_FETCH_FAILED)),
      ),
    )

    await expect(
      client.queue.result({ requestId: 'pd_VEwnjvrLmVq5hzjpY5gUsNq4' }),
    ).rejects.toMatchObject({
      code: 'invalid_input',
      reason: 'input_fetch_failed',
      retryable: false,
    })
  })

  it('rejects with the same shape subscribe() produces for that failure', async () => {
    // The point of the whole exercise: two ways of learning a prediction
    // failed must not disagree about what the failure was.
    const client = clientWith(() =>
      Promise.reject(
        axiosErrorWith(predictionFailedBody(PROD_MODERATION_BLOCKED)),
      ),
    )

    const fromResult = await client.queue
      .result({ requestId: 'pd_a839exsaLNmVZzWvDaxAuapS' })
      .catch((error: SunraError) => error)

    const completed: SunraCompletedQueueStatus = {
      status: 'COMPLETED',
      request_id: 'pd_a839exsaLNmVZzWvDaxAuapS',
      response_url: 'https://api.sunra.ai/v1/queue/requests/pd_a839exsaLNmVZzWvDaxAuapS',
      success: false,
      error: PROD_MODERATION_BLOCKED,
    }
    const fromSubscribe = new SunraError({
      type: 'prediction_failed',
      code: completed.error!.code,
      message: completed.error!.message,
      reason: completed.error!.reason,
      retryable: completed.error!.retryable,
      timestamp: completed.error!.timestamp,
      predictionError: completed.error!,
    })

    expect(fromResult.code).toBe(fromSubscribe.code)
    expect(fromResult.reason).toBe(fromSubscribe.reason)
    expect(fromResult.retryable).toBe(fromSubscribe.retryable)
    expect(fromResult.message).toBe(fromSubscribe.message)
    expect(fromResult.predictionError).toEqual(fromSubscribe.predictionError)
    // `type` was the one field this comparison originally omitted, and it was
    // the one field that had actually drifted (the subscribe path left it
    // undefined). Asserted explicitly so the gap cannot reopen.
    expect(fromResult.type).toBe(fromSubscribe.type)
  })

  it('classifies a subscribe-path failure as prediction_failed', async () => {
    // Built the way `subscribeToStatus`'s `rejectSunraError` builds it.
    const completed: SunraCompletedQueueStatus = {
      status: 'COMPLETED',
      request_id: 'pd_a839exsaLNmVZzWvDaxAuapS',
      response_url: 'https://api.sunra.ai/v1/queue/requests/pd_a839exsaLNmVZzWvDaxAuapS',
      success: false,
      error: PROD_MODERATION_BLOCKED,
    }
    const error = new SunraError({
      type: 'prediction_failed',
      code: completed.error!.code,
      message: completed.error!.message,
      predictionError: completed.error!,
    })
    expect(error.type).toBe('prediction_failed')
    expect(error.toJSON().error.type).toBe('prediction_failed')
  })

  it('still resolves with the output when the prediction succeeded', async () => {
    const output = { images: [{ url: 'https://assets.sunra.ai/x.png' }] }
    const client = clientWith(() => Promise.resolve({ data: output }))

    await expect(
      client.queue.result({ requestId: 'pd_ok' }),
    ).resolves.toEqual({ data: output, requestId: 'pd_ok' })
  })
})

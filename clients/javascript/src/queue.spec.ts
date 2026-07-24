import { describe, expect, it, vi } from 'vitest'
import { createConfig } from './config'
import { SunraQueueClientImpl } from './queue'

describe('SunraQueueClientImpl provider routing', () => {
  it('writes provider preferences into the canonical request body and compatibility header', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { status: 'IN_QUEUE', request_id: 'pd_test' },
    })
    const client = new SunraQueueClientImpl(
      () => createConfig({
        credentials: 'key_test',
        axios: { request } as any,
      }),
      {
        transformInput: vi.fn(async input => input),
      } as any,
    )

    await client.submit('google/gemini-2.5-flash-image/text-to-image', {
      input: { prompt: 'sunrise' },
      provider: { only: ['fal'] },
    })

    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        prompt: 'sunrise',
        provider: { only: ['fal'] },
      },
      headers: expect.objectContaining({
        'x-provider-settings': JSON.stringify({ only: ['fal'] }),
      }),
    }))
  })

  it('does not add provider routing fields when automatic routing is used', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { status: 'IN_QUEUE', request_id: 'pd_test' },
    })
    const client = new SunraQueueClientImpl(
      () => createConfig({
        credentials: 'key_test',
        axios: { request } as any,
      }),
      {
        transformInput: vi.fn(async input => input),
      } as any,
    )

    await client.submit('google/gemini-2.5-flash-image/text-to-image', {
      input: { prompt: 'sunrise' },
    })

    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      data: { prompt: 'sunrise' },
    }))
    expect(request.mock.calls[0][0].headers).not.toHaveProperty(
      'x-provider-settings',
    )
  })
})

import { expect, test } from 'vitest'
import { defaultResponseHandler } from './response'

test('[Response/defaultResponseHandler]', async () => {
  expect(defaultResponseHandler(new Response({
    text: 'test'
  })))
})
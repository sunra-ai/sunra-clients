import { buildUrl } from './request'
import { expect, test } from 'vitest'

test('[Queue/Request]', () => {
  const alias = 'sunra/lcm/text-to-image'
  const url = buildUrl(alias)
  expect(url).toMatch(`https://api.sunra.ai/v1/${alias}`)
})

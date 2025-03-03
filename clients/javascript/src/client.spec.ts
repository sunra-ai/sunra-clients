import { buildUrl } from './request'
import { describe, expect, test } from 'vitest'

describe('The function test suite', () => {
  test('should build the URL with a function username/app-alias', () => {
    const alias = 'sunra/text-to-image'
    const url = buildUrl(alias)
    expect(url).toMatch(`sunra.ai/${alias}`)
  })
})

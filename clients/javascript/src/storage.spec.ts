import { expect, test } from 'vitest'
import { createStorageClient } from './storage'
import { demoConfig } from '../mocks/data/config'
import { whisper } from './utils'

test('[Storage]', () => {
  const client = createStorageClient({
    config: demoConfig,
  })
  whisper('client is: ', client)
  expect(client).toBeDefined()
})

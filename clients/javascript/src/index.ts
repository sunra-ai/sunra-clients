import { createSunraClient, type SunraClient } from './client'
import { SunraClientConfig } from './config'
import { SunraRunOptions } from './types/common'

export {
  createSunraClient as createSunraClient,
  type SunraClient,
} from './client'
export type { QueueClient } from './queue'
export { ApiError, ValidationError } from './response'
export type { StorageClient } from './storage'
export * from './types/common'
export type {
  SunraQueueStatus as QueueStatus,
  ValidationErrorInfo,
  SunraWebHookResponse as WebHookResponse,
} from './types/common'
export { parseEndpointId } from './utils'

type SingletonSunraClient = {
  config(config: SunraClientConfig): void;
} & SunraClient;

/**
 * Creates a singleton instance of the client. This is useful as a compatibility
 * layer for existing code that uses the clients version prior to 1.0.0.
 */
export const sunra: SingletonSunraClient =
  (function createSingletonSunraClient() {
    let currentInstance: SunraClient = createSunraClient()
    return {
      config(config: SunraClientConfig) {
        currentInstance = createSunraClient(config)
      },
      get queue() {
        return currentInstance.queue
      },
      get storage() {
        return currentInstance.storage
      },
      run(id: string, options: SunraRunOptions<any>) {
        return currentInstance.run(id, options)
      },
      subscribe(
        endpointId: string,
        options: SunraRunOptions<any>,
      ) {
        return currentInstance.subscribe(endpointId, options)
      },
    } satisfies SingletonSunraClient
  })()

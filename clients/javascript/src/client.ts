import { SunraClientConfig, createConfig } from './config'
import { createQueueClient, SunraQueueClient, QueueSubscribeOptions } from './queue'
import { createStorageClient, StorageClient } from './storage'
import { SunraResult, SunraRunOptions } from './types'

/**
 * The main client type, it provides access to simple API model usage,
 * as well as access to the `queue` and `storage` APIs.
 *
 * @see createSunraClient
 */
export interface SunraClient {
  /**
   * The queue client to interact with the queue API.
   */
  readonly queue: SunraQueueClient;

  /**
   * The storage client to interact with the storage API.
   */
  readonly storage: StorageClient;

  /**
   * Subscribes to updates for a specific request in the queue.
   *
   * @param endpointId - The ID of the API endpoint.
   * @param options - Options to configure how the request is run and how updates are received.
   * @returns A promise that resolves to the result of the request once it's completed.
   */
  subscribe(endpointId: string, options: SunraRunOptions<any> & QueueSubscribeOptions): Promise<SunraResult<any>>;
}

/**
 * Creates a new reference of the `SunraClient`.
 * @param userConfig Optional configuration to override the default settings.
 * @returns a new instance of the `SunraClient`.
 */
export function createSunraClient(userConfig: SunraClientConfig = {}): SunraClient {
  const config = createConfig(userConfig)
  const storage = createStorageClient({ config })
  const queue = createQueueClient({ config, storage })
  return {
    queue,
    storage,
    subscribe: async (endpointId, options) => {
      const { request_id: requestId } = await queue.submit(endpointId, options)
      if (options.onEnqueue) {
        options.onEnqueue(requestId)
      }
      await queue.subscribeToStatus(endpointId, { requestId, ...options })
      return queue.result(endpointId, { requestId })
    },
  }
}

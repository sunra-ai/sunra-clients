import { SunraClientConfig, createConfig } from './config'
import { createQueueClient, QueueClient, QueueSubscribeOptions } from './queue'
import { buildUrl, dispatchRequest } from './request'
import { createStorageClient, StorageClient } from './storage'
import { SunraResult, SunraRunOptions } from './types/common'

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
  readonly queue: QueueClient;

  /**
   * The storage client to interact with the storage API.
   */
  readonly storage: StorageClient;

  /**
   * Runs a sunra endpoints identified by its `endpointId`.
   *
   * @param endpointId the registered function revision id or alias.
   * @returns the remote function output
   */
  run(endpointId: string, options: SunraRunOptions<any>): Promise<SunraResult<any>>;

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
    async run(endpointId: string, options: SunraRunOptions<any> = {}): Promise<SunraResult<any>> {
      const input = options.input
        ? await storage.transformInput(options.input)
        : undefined
      return dispatchRequest<any, SunraResult<any>>({
        targetUrl: buildUrl(endpointId, {
          subdomain: 'queue',
          ...options
        }),
        input: input as any,
        config,
      })
    },
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

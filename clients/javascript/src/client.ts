import { SunraClientConfig, createConfig, credentialsFromEnv, RequiredConfig } from './config'
import { createQueueClient, SunraQueueClient, QueueSubscribeOptions } from './queue'
import { createStorageClient, SunraStorageClient } from './storage'
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
  readonly storage: SunraStorageClient;

  /**
   * Configures the client with a new configuration.
   * @param config - The new configuration to use.
   */
  config(config: SunraClientConfig): void;

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
 * Implementation of the SunraClient interface
 */
export class SunraClientImpl implements SunraClient {
  private _config: RequiredConfig
  readonly queue: SunraQueueClient
  readonly storage: SunraStorageClient

  constructor(userConfig: SunraClientConfig = {}) {
    this._config = createConfig(userConfig)
    this.storage = createStorageClient({ getConfig: () => this._config })
    this.queue = createQueueClient({ getConfig: () => this._config, storage: this.storage })
  }

  config(config: SunraClientConfig) {
    this._config = createConfig(config)
  }

  async subscribe(endpointId: string, options: SunraRunOptions<any> & QueueSubscribeOptions): Promise<SunraResult<any>> {
    const { request_id: requestId } = await this.queue.submit(endpointId, options)
    if (options.onEnqueue) {
      options.onEnqueue(requestId)
    }
    await this.queue.subscribeToStatus({ requestId, ...options })
    return this.queue.result({ requestId })
  }
}

/**
 * Creates a new reference of the `SunraClient`.
 * @param userConfig Optional configuration to override the default settings.
 * @returns a new instance of the `SunraClient`.
 */
export function createSunraClient(userConfig: SunraClientConfig = {}): SunraClient {
  return new SunraClientImpl(userConfig)
}

export const sunra = createSunraClient({
  credentials: credentialsFromEnv
})

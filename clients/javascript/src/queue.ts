import { RequiredConfig } from './config'
import { dispatchRequest } from './request'
import { getRestApiUrl } from './utils'
import { SunraStorageClient } from './storage'
import {
  SunraCompletedQueueStatus,
  SunraInQueueQueueStatus,
  SunraQueueStatus,
  SunraResult,
  SunraRunOptions,
} from './types'

type QueueStatusSubscriptionOptions = QueueStatusOptions &
  Omit<QueueSubscribeOptions, 'onEnqueue' | 'webhookUrl'> & {
    maxRetries?: number;
  }

type TimeoutId = ReturnType<typeof setTimeout> | undefined;

const DEFAULT_POLL_INTERVAL = 1000

/**
 * Options for subscribing to the request queue.
 */
export type QueueSubscribeOptions = {
  /**
   * The mode to use for subscribing to updates. It defaults to `polling`.
   *
   * @see pollInterval
   */
  mode?: 'polling'

  /**
   * The interval (in milliseconds) at which to poll for updates.
   * If not provided, a default value of `1000` will be used.
   */
  pollInterval?: number;

  /**
   * Callback function that is called when a request is enqueued.
   * @param requestId - The unique identifier for the enqueued request.
   */
  onEnqueue?: (requestId: string) => void;

  /**
   * Callback function that is called when the status of the queue changes.
   * @param status - The current status of the queue.
   */
  onQueueUpdate?: (status: SunraQueueStatus) => void;

  /**
   * If `true`, the response will include the logs for the request.
   * Defaults to `false`.
   */
  logs?: boolean;

  /**
   * The timeout (in milliseconds) for the request. If the request is not
   * completed within this time, the subscription will be cancelled.
   *
   * Keep in mind that although the client resolves the function on a timeout,
   * and will try to cancel the request on the server, the server might not be
   * able to cancel the request if it's already running.
   *
   * Note: currently, the timeout is not enforced and the default is `undefined`.
   * This behavior might change in the future.
   */
  timeout?: number;

  /**
   * The URL to send a webhook notification to when the request is completed.
   * @see WebHookResponse
   */
  webhookUrl?: string;
}

/**
 * Options for submitting a request to the queue.
 */
type SubmitOptions<Input> = SunraRunOptions<Input> & {
  /**
   * The URL to send a webhook notification to when the request is completed.
   * @see WebHookResponse
   */
  webhookUrl?: string;
};

type BaseQueueOptions = {
  /**
   * The unique identifier for the enqueued request.
   */
  requestId: string;
};

type QueueStatusOptions = BaseQueueOptions & {
  /**
   * If `true`, the response will include the logs for the request.
   * Defaults to `false`.
   */
  logs?: boolean;
};

/**
 * Represents a request queue with methods for submitting requests,
 * checking their status, retrieving results, and subscribing to updates.
 */
export interface SunraQueueClient {
  /**
   * Submits a request to the queue.
   *
   * @param endpointId - The ID of the function web endpoint.
   * @param options - Options to configure how the request is run.
   * @returns A promise that resolves to the result of enqueuing the request.
   */
  submit(endpointId: string, options: SubmitOptions<any>): Promise<SunraInQueueQueueStatus>;

  /**
   * Retrieves the status of a specific request in the queue.
   *
   * @param options - Options to configure how the request is run.
   * @returns A promise that resolves to the status of the request.
   */
  status(options: QueueStatusOptions): Promise<SunraQueueStatus>;

  /**
   * Subscribes to updates for a specific request in the queue using polling or streaming.
   * See `options.mode` for more details.
   *
   * @param options - Options to configure how the request is run and how updates are received.
   * @returns A promise that resolves to the final status of the request.
   */
  subscribeToStatus(options: QueueStatusSubscriptionOptions): Promise<SunraCompletedQueueStatus>;

  /**
   * Retrieves the result of a specific request from the queue.
   *
   * @param options - Options to configure how the request is run.
   * @returns A promise that resolves to the result of the request.
   */
  result(options: BaseQueueOptions): Promise<SunraResult<any>>;

  /**
   * Cancels a request in the queue.
   *
   * @param options - Options to configure how the request
   * is run and how updates are received.
   * @returns A promise that resolves once the request is cancelled.
   * @throws {Error} If the request cannot be cancelled.
   */
  cancel(options: BaseQueueOptions): Promise<void>;
}

type QueueClientDependencies = {
  getConfig: () => RequiredConfig;
  storage: SunraStorageClient;
};

/**
 * Implementation of the SunraQueueClient interface
 */
export class SunraQueueClientImpl implements SunraQueueClient {
  constructor(
    private readonly getConfig: () => RequiredConfig,
    private readonly storage: SunraStorageClient
  ) { }

  get config() {
    return this.getConfig()
  }

  async submit<Input>(
    endpointId: string,
    options: SubmitOptions<Input>,
  ): Promise<SunraInQueueQueueStatus> {
    const webhookUrl = options?.webhookUrl
    const input = options?.input
      ? await this.storage.transformInput(options.input)
      : undefined

    const baseUrl = `${getRestApiUrl()}/queue/${endpointId}`
    const search = webhookUrl ? `?webhook=${webhookUrl}` : ''
    const url = `${baseUrl}${search}`
    return dispatchRequest<Input, SunraInQueueQueueStatus>({
      targetUrl: url,
      input: input as Input,
      config: this.config,
    })
  }

  async status({ requestId, logs = false }: QueueStatusOptions): Promise<SunraQueueStatus> {
    const baseUrl = `${getRestApiUrl()}/queue/requests/${requestId}/status`
    const search = logs ? '?logs=1' : '?logs=0'
    const url = `${baseUrl}${search}`
    return dispatchRequest<unknown, SunraQueueStatus>({
      method: 'get',
      targetUrl: url,
      config: this.config,
    })
  }

  async subscribeToStatus(options: QueueStatusSubscriptionOptions): Promise<SunraCompletedQueueStatus> {
    const requestId = options.requestId
    const timeout = options.timeout
    let timeoutId: TimeoutId = undefined

    const maxRetries = options.maxRetries ?? 3
    let retries = 0

    return new Promise<SunraCompletedQueueStatus>((resolve, reject) => {
      let pollingTimeoutId: TimeoutId
      const pollInterval =
        'pollInterval' in options && typeof options.pollInterval === 'number'
          ? (options.pollInterval ?? DEFAULT_POLL_INTERVAL)
          : DEFAULT_POLL_INTERVAL

      const clearScheduledTasks = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        if (pollingTimeoutId) {
          clearTimeout(pollingTimeoutId)
        }
      }
      if (timeout) {
        timeoutId = setTimeout(() => {
          clearScheduledTasks()
          this.cancel({ requestId }).catch(console.error)
          reject(
            new Error(
              `Client timed out waiting for the request to complete after ${timeout}ms`,
            ),
          )
        }, timeout)
      }
      const poll = async () => {
        try {
          const requestStatus = await this.status({
            requestId,
            logs: options.logs ?? false,
          })
          if (options.onQueueUpdate) {
            options.onQueueUpdate(requestStatus)
          }
          if (requestStatus.status === 'COMPLETED') {
            clearScheduledTasks()
            resolve(requestStatus)
            return
          }
          pollingTimeoutId = setTimeout(poll, pollInterval)
          retries = 0
        } catch (error) {
          if (retries < maxRetries) {
            retries++
            pollingTimeoutId = setTimeout(poll, pollInterval)
            return
          }
          clearScheduledTasks()
          reject(error)
        }
      }
      poll().catch(reject)
    })
  }

  async result<Output>({ requestId }: BaseQueueOptions): Promise<SunraResult<Output>> {
    const data = await dispatchRequest<unknown, Output>({
      method: 'get',
      targetUrl: `${getRestApiUrl()}/queue/requests/${requestId}`,
      config: this.config,
    })

    return {
      data,
      requestId,
    }
  }

  async cancel({ requestId }: BaseQueueOptions): Promise<void> {
    await dispatchRequest<unknown, void>({
      method: 'put',
      targetUrl: `${getRestApiUrl()}/queue/requests/${requestId}/cancel`,
      config: this.config,
    })
  }
}

export const createQueueClient = ({
  getConfig,
  storage,
}: QueueClientDependencies): SunraQueueClient => {
  return new SunraQueueClientImpl(getConfig, storage)
}

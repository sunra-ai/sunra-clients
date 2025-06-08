import { RequiredConfig } from './config'
import { buildUrl, dispatchRequest } from './request'
import { StorageClient } from './storage'
import {
  SunraCompletedQueueStatus,
  SunraInQueueQueueStatus,
  SunraQueueStatus,
  SunraResult,
  SunraRunOptions,
} from './types/common'

type QueuePriority = 'low' | 'normal';
type QueueStatusSubscriptionOptions = QueueStatusOptions &
  Omit<QueueSubscribeOptions, 'onEnqueue' | 'webhookUrl'>;

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

  /**
   * The priority of the request. It defaults to `normal`.
   * @see QueuePriority
   */
  priority?: QueuePriority;
} & (
    | {
      mode?: 'polling';
      /**
       * The interval (in milliseconds) at which to poll for updates.
       * If not provided, a default value of `500` will be used.
       *
       * This value is ignored if `mode` is set to `streaming`.
       */
      pollInterval?: number;
    }
  );

/**
 * Options for submitting a request to the queue.
 */
type SubmitOptions<Input> = SunraRunOptions<Input> & {
  /**
   * The URL to send a webhook notification to when the request is completed.
   * @see WebHookResponse
   */
  webhookUrl?: string;

  /**
   * The priority of the request. It defaults to `normal`.
   * @see QueuePriority
   */
  priority?: QueuePriority;
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
export interface QueueClient {
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
   * @param endpointId - The ID of the function web endpoint.
   * @param options - Options to configure how the request is run.
   * @returns A promise that resolves to the status of the request.
   */
  status(endpointId: string, options: QueueStatusOptions): Promise<SunraQueueStatus>;

  /**
   * Subscribes to updates for a specific request in the queue using polling or streaming.
   * See `options.mode` for more details.
   *
   * @param endpointId - The ID of the function web endpoint.
   * @param options - Options to configure how the request is run and how updates are received.
   * @returns A promise that resolves to the final status of the request.
   */
  subscribeToStatus(
    endpointId: string,
    options: QueueStatusSubscriptionOptions,
  ): Promise<SunraCompletedQueueStatus>;

  /**
   * Retrieves the result of a specific request from the queue.
   *
   * @param endpointId - The ID of the function web endpoint.
   * @param options - Options to configure how the request is run.
   * @returns A promise that resolves to the result of the request.
   */
  result(endpointId: string, options: BaseQueueOptions): Promise<SunraResult<any>>;

  /**
   * Cancels a request in the queue.
   *
   * @param endpointId - The ID of the function web endpoint.
   * @param options - Options to configure how the request
   * is run and how updates are received.
   * @returns A promise that resolves once the request is cancelled.
   * @throws {Error} If the request cannot be cancelled.
   */
  cancel(endpointId: string, options: BaseQueueOptions): Promise<void>;
}

type QueueClientDependencies = {
  config: RequiredConfig;
  storage: StorageClient;
};

export const createQueueClient = ({
  config,
  storage,
}: QueueClientDependencies): QueueClient => {
  const ref: QueueClient = {
    async submit<Input>(
      endpointId: string,
      options: SubmitOptions<Input>,
    ): Promise<SunraInQueueQueueStatus> {
      const { webhookUrl, priority, ...runOptions } = options
      const input = options.input
        ? await storage.transformInput(options.input)
        : undefined
      return dispatchRequest<Input, SunraInQueueQueueStatus>({
        targetUrl: buildUrl(endpointId, {
          ...runOptions,
          subdomain: 'queue',
          query: webhookUrl ? { webhook: webhookUrl } : undefined,
        }),
        headers: {
          'x-sunra-queue-priority': priority ?? 'normal',
        },
        input: input as Input,
        config,
      })
    },
    async status(
      endpointId: string,
      { requestId, logs = false }: QueueStatusOptions,
    ): Promise<SunraQueueStatus> {
      return dispatchRequest<unknown, SunraQueueStatus>({
        method: 'get',
        targetUrl: buildUrl('', {
          subdomain: 'queue',
          query: { logs: logs ? '1' : '0' },
          path: `/requests/${requestId}/status`,
        }),
        config,
      })
    },

    async subscribeToStatus(
      endpointId,
      options,
    ): Promise<SunraCompletedQueueStatus> {
      const requestId = options.requestId
      const timeout = options.timeout
      let timeoutId: TimeoutId = undefined

      const handleCancelError = () => {
        // Ignore errors as the client will follow through with the timeout
        // regardless of the server response. In case cancelation fails, we
        // still want to reject the promise and consider the client call canceled.
      }

      return new Promise<SunraCompletedQueueStatus>((resolve, reject) => {
        let pollingTimeoutId: TimeoutId
        // type resolution isn't great in this case, so check for its presence
        // and and type so the typechecker behaves as expected
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
            ref.cancel(endpointId, { requestId }).catch(handleCancelError)
            reject(
              new Error(
                `Client timed out waiting for the request to complete after ${timeout}ms`,
              ),
            )
          }, timeout)
        }
        const poll = async () => {
          try {
            const requestStatus = await ref.status(endpointId, {
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
          } catch (error) {
            clearScheduledTasks()
            reject(error)
          }
        }
        poll().catch(reject)
      })
    },

    async result<Output>(
      endpointId: string,
      { requestId }: BaseQueueOptions,
    ): Promise<SunraResult<Output>> {
      return dispatchRequest<unknown, SunraResult<Output>>({
        method: 'get',
        targetUrl: buildUrl('', {
          subdomain: 'queue',
          path: `/requests/${requestId}`,
        }),
        config,
      })
    },

    async cancel(
      endpointId: string,
      { requestId }: BaseQueueOptions,
    ): Promise<void> {
      await dispatchRequest<unknown, void>({
        method: 'put',
        targetUrl: buildUrl('', {
          subdomain: 'queue',
          path: `/requests/${requestId}/cancel`,
        }),
        config,
      })
    },
  }
  return ref
}

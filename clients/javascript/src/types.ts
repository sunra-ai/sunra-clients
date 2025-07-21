import { SunraError } from './errors'

/**
 * Represents an API result, containing the data,
 *  the request ID and any other relevant information.
 */
export type SunraResult<T> = {
  data: T;
  requestId: string;
};

/**
 * The function input and other configuration when running
 * the function, such as the HTTP method to use.
 */
export type SunraRunOptions<Input> = {
  /**
   * The function input. It will be submitted either as query params
   * or the body payload, depending on the `method`.
   */
  readonly input?: Input;

  /**
   * Optional error callback. If provided, errors will be passed to this
   * callback instead of being thrown as exceptions.
   */
  readonly onError?: (error: SunraError) => void;
};

export type SunraMetrics = {
  inference_time: number | null;
};

interface SunraBaseQueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED';
  request_id: string;
}

export interface SunraInQueueQueueStatus extends SunraBaseQueueStatus {
  status: 'IN_QUEUE';
  queue_position: number;
  response_url: string;
}

export interface SunraInProgressQueueStatus extends SunraBaseQueueStatus {
  status: 'IN_PROGRESS';
  response_url: string;
  logs?: string
}

export interface SunraCompletedQueueStatus extends SunraBaseQueueStatus {
  status: 'COMPLETED';
  response_url: string;
  logs?: string;
  metrics?: SunraMetrics;
  success: boolean;
  error: null | {
    code: string;
    message: string;
    details?: Record<string, any>
    timestamp: string
  };
}

export type SunraQueueStatus =
  | SunraInProgressQueueStatus
  | SunraCompletedQueueStatus
  | SunraInQueueQueueStatus;

/**
 * Represents the response from a WebHook request.
 * This is a union type that varies based on the `status` property.
 *
 * @template Payload - The type of the payload in the response. It defaults to `any`,
 * allowing for flexibility in specifying the structure of the payload.
 */
export type SunraWebHookResponse<Payload = any> =
  | {
    /** Indicates a successful response. */
    status: 'OK';
    /** The payload of the response, structure determined by the Payload type. */
    payload: Payload;
    /** Error is never present in a successful response. */
    error: never;
    /** The unique identifier for the request. */
    request_id: string;
  }
  | {
    /** Indicates an unsuccessful response. */
    status: 'ERROR';
    /** The payload of the response, structure determined by the Payload type. */
    payload: Payload;
    /** Description of the error that occurred. */
    error: string;
    /** The unique identifier for the request. */
    request_id: string;
  };

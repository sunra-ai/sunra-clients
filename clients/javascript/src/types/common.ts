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
};

export type UrlOptions = {
  /**
   * If `true`, the function will use the queue to run the function
   * asynchronously and return the result in a separate call. This
   * influences how the URL is built.
   */
  readonly subdomain?: string;

  /**
   * The query parameters to include in the URL.
   */
  readonly query?: Record<string, string>;

  /**
   * The path to append to the function URL.
   */
  path?: string;
};

export type RequestLog = {
  message: string;
  level: 'STDERR' | 'STDOUT' | 'ERROR' | 'INFO' | 'WARN' | 'DEBUG';
  source: 'USER';
  timestamp: string; // Using string to represent date-time format, but you could also use 'Date' type if you're going to construct Date objects.
};

export type Metrics = {
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
  logs: RequestLog[];
}

export interface SunraCompletedQueueStatus extends SunraBaseQueueStatus {
  status: 'COMPLETED';
  response_url: string;
  logs: RequestLog[];
  metrics?: Metrics;
}

export type SunraQueueStatus =
  | SunraInProgressQueueStatus
  | SunraCompletedQueueStatus
  | SunraInQueueQueueStatus;

export function isQueueStatus(obj: any): obj is SunraQueueStatus {
  return obj && obj.status && obj.response_url
}

export function isCompletedQueueStatus(obj: any): obj is SunraCompletedQueueStatus {
  return isQueueStatus(obj) && obj.status === 'COMPLETED'
}

export type ValidationErrorInfo = {
  msg: string;
  loc: Array<string | number>;
  type: string;
};

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

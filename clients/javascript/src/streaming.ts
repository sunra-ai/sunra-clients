import { createParser } from 'eventsource-parser'
import { RequiredConfig } from './config'
import { dispatchRequest } from './request'
import { type SunraStorageClient } from './storage'

const CONTENT_TYPE_EVENT_STREAM = 'text/event-stream'

/**
 * The stream API options. It requires the API input and also
 * offers configuration options.
 */
export type StreamOptions<Input> = {
  /**
   * The endpoint URL. If not provided, it will be generated from the
   * `endpointId` and the `queryParams`.
   */
  readonly url?: string;

  /**
   * The API input payload.
   */
  readonly input?: Input;

  /**
   * The query parameters to be sent with the request.
   */
  readonly queryParams?: Record<string, string>;

  /**
   * The maximum time interval in milliseconds between stream chunks. Defaults to 15s.
   */
  readonly timeout?: number;

  /**
   * Whether it should auto-upload File-like types to sunra's storage
   * or not.
   */
  readonly autoUpload?: boolean;

  /**
   * The HTTP method, defaults to `post`;
   */
  readonly method?: 'get' | 'post' | 'put' | 'delete' | string;

  /**
   * The content type the client accepts as response.
   * By default this is set to `text/event-stream`.
   */
  readonly accept?: string;

  /**
   * The signal to abort the request.
   */
  readonly signal?: AbortSignal;
};

const EVENT_STREAM_TIMEOUT = 15 * 1000

type SunraStreamEventType = 'data' | 'error' | 'done';

type EventHandler<T = any> = (event: T) => void;

/**
 * The class representing a streaming response. With t
 */
export class SunraStream<Input, Output> {
  // properties
  config: RequiredConfig
  url: string
  options: StreamOptions<Input>

  // support for event listeners
  private listeners: Map<SunraStreamEventType, EventHandler[]> = new Map()
  private buffer: Output[] = []

  // local state
  private currentData: Output | undefined = undefined
  private lastEventTimestamp = 0
  private streamClosed = false
  private donePromise: Promise<Output>

  private abortController = new AbortController()

  constructor(
    config: RequiredConfig,
    options: StreamOptions<Input>,
  ) {
    this.config = config
    this.url = options.url ?? ''
    this.options = options
    this.donePromise = new Promise<Output>((resolve, reject) => {
      if (this.streamClosed) {
        reject(
          new Error('Streaming connection is already closed.'),
        )
      }
      this.signal.addEventListener('abort', () => {
        resolve(this.currentData ?? ({} as Output))
      })
      this.on('done', (data) => {
        this.streamClosed = true
        resolve(data)
      })
      this.on('error', (error) => {
        this.streamClosed = true
        reject(error)
      })
    })
    // if a abort signal was passed, sync it with the internal one
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        this.abortController.abort()
      })
    }

    // start the streaming request
    this.start().catch(this.handleError)
  }

  private start = async () => {
    const { options } = this
    const { input, method = 'post' } = options
    try {
      return await dispatchRequest({
        method: method.toUpperCase(),
        targetUrl: this.url,
        input,
        config: this.config,
      })
    } catch (error) {
      this.handleError(error)
    }
  }

  private handleResponse = async (response: Response) => {
    if (!response.ok) {
      this.emit('error', new Error('Response failed.'))
      return
    }

    const body = response.body
    if (!body) {
      this.emit(
        'error',
        new Error('Response body is empty.'),
      )
      return
    }

    const isEventStream = (
      response.headers.get('content-type') ?? ''
    ).startsWith(CONTENT_TYPE_EVENT_STREAM)
    // any response that is not a text/event-stream will be handled as a binary stream
    if (!isEventStream) {
      const reader = body.getReader()
      const emitRawChunk = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            this.emit('done', this.currentData)
            return
          }
          this.currentData = value as Output
          this.emit('data', value)
          emitRawChunk()
        })
      }
      emitRawChunk()
      return
    }

    const decoder = new TextDecoder('utf-8')
    const reader = response.body.getReader()

    const parser = createParser((event) => {
      if (event.type === 'event') {
        const data = event.data

        try {
          const parsedData = JSON.parse(data)
          this.buffer.push(parsedData)
          this.currentData = parsedData
          this.emit('data', parsedData)

          // also emit 'message'for backwards compatibility
          this.emit('message' as any, parsedData)
        } catch (e) {
          this.emit('error', e)
        }
      }
    })

    const timeout = this.options.timeout ?? EVENT_STREAM_TIMEOUT

    const readPartialResponse = async () => {
      const { value, done } = await reader.read()
      this.lastEventTimestamp = Date.now()

      parser.feed(decoder.decode(value))

      if (Date.now() - this.lastEventTimestamp > timeout) {
        this.emit(
          'error',
          new Error(`Event stream timed out after ${(timeout / 1000).toFixed(0)} seconds with no messages.`),
        )
      }

      if (!done) {
        readPartialResponse().catch(this.handleError)
      } else {
        this.emit('done', this.currentData)
      }
    }

    readPartialResponse().catch(this.handleError)
    return
  }

  private handleError = (error: any) => {
    // In case AbortError is thrown but the signal is marked as aborted
    // it means the user called abort() and we should not emit an error
    // as it's expected behavior
    // See note on: https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
    if (error.name === 'AbortError' || this.signal.aborted) {
      return
    }
    const apiError = error ?? new Error(error.message as string ?? 'An unknown error occurred')
    this.emit('error', apiError)
    return
  }

  public on = (type: SunraStreamEventType, listener: EventHandler) => {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)?.push(listener)
  }

  private emit = (type: SunraStreamEventType, event: any) => {
    const listeners = this.listeners.get(type) || []
    for (const listener of listeners) {
      listener(event)
    }
  }

  async *[Symbol.asyncIterator]() {
    let running = true
    const stopAsyncIterator = () => (running = false)
    this.on('error', stopAsyncIterator)
    this.on('done', stopAsyncIterator)
    while (running) {
      const data = this.buffer.shift()
      if (data) {
        yield data
      }

      // the short timeout ensures the while loop doesn't block other
      // frames getting executed concurrently
      await new Promise((resolve) => setTimeout(resolve, 16))
    }
  }

  /**
   * Gets a reference to the `Promise` that indicates whether the streaming
   * is done or not. Developers should always call this in their apps to ensure
   * the request is over.
   *
   * An alternative to this, is to use `on('done')` in case your application
   * architecture works best with event listeners.
   *
   * @returns the promise that resolves when the request is done.
   */
  public done = async () => this.donePromise

  /**
   * Aborts the streaming request.
   *
   * **Note:** This method is noop in case the request is already done.
   *
   * @param reason optional cause for aborting the request.
   */
  public abort = (reason?: string | Error) => {
    if (!this.streamClosed) {
      this.abortController.abort(reason)
    }
  }

  /**
   * Gets the `AbortSignal` instance that can be used to listen for abort events.
   *
   * **Note:** this signal is internal to the `SunraStream` instance. If you pass your
   * own abort signal, the `SunraStream` will listen to it and abort it appropriately.
   *
   * @returns the `AbortSignal` instance.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
   */
  public get signal() {
    return this.abortController.signal
  }
}

/**
 * The streaming client interface.
 */
export interface StreamingClient {
  /**
   * Calls a sunra app that supports streaming and provides a streaming-capable
   * object as a result, that can be used to get partial results through either
   * `AsyncIterator` or through an event listener.
   *
   * @param options the request options, including the input payload.
   * @returns the `SunraStream` instance.
   */
  stream(
    options: StreamOptions<any>,
  ): Promise<SunraStream<any, any>>;
}

type StreamingClientDependencies = {
  config: RequiredConfig;
  storage: SunraStorageClient;
};

export function createStreamingClient({
  config,
  storage,
}: StreamingClientDependencies): StreamingClient {
  return {
    async stream(
      options: StreamOptions<any>,
    ) {
      const input = options.input
        ? await storage.transformInput(options.input)
        : undefined
      return new SunraStream<any, any>(
        config,
        {
          ...options,
          input: input as any,
        },
      )
    },
  }
}

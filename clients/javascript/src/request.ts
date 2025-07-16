import { AxiosRequestConfig } from 'axios'
import { RequiredConfig } from './config'
import { isBrowser, whisper } from './utils'
import packageInfo from '../package.json'
import axios from 'axios'
import { createParser, EventSourceMessage } from 'eventsource-parser'

function getUserAgent(): string {
  return `${packageInfo.name}/${packageInfo.version}`
}


type RequestParams<Input = any> = {
  method?: string;
  targetUrl: string;
  input?: Input;
  config: RequiredConfig;
  headers?: Record<string, string>;
};

type RequestParamsWithStream<Input = any> = RequestParams<Input> & {
  onData?: (data: any) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
};

const getAxiosConfig = (params: RequestParams<any>) => {
  const { targetUrl, input, config } = params
  const { credentials: credentialsValue, proxyUrl } = config
  const userAgent = isBrowser() ? {} : { 'User-Agent': getUserAgent() }
  const credentials =
    typeof credentialsValue === 'function'
      ? credentialsValue()
      : credentialsValue

  const { method, headers } = ({
    method: (params?.method ?? 'POST').toUpperCase(),
    headers: params.headers,
  })
  const authHeader = credentials ? { Authorization: `Key ${credentials}` } : {}

  const useProxy = proxyUrl && !targetUrl.startsWith(proxyUrl)

  const url = useProxy ? proxyUrl : targetUrl

  const requestHeaders = {
    ...authHeader,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(useProxy ? { 'x-sunra-target-url': targetUrl } : {}),
    ...userAgent,
    ...(headers ?? {}),
  }

  const axiosConfig: AxiosRequestConfig = {
    url,
    method,
    headers: requestHeaders,
    data: input
  }
  return axiosConfig
}

export async function dispatchRequest<Input, Output>(
  params: RequestParams<Input>,
): Promise<Output> {
  const axiosInstance = params?.config?.axios ?? axios
  const axiosConfig = getAxiosConfig(params)

  const response = await axiosInstance.request(axiosConfig)
  return response.data
}

export async function dispatchRequestWithStream<Input, Output>(
  params: RequestParamsWithStream<Input>,
): Promise<Output> {
  const axiosInstance = params?.config?.axios ?? axios
  const { onData, onError, onEnd } = params
  const axiosConfig = getAxiosConfig(params)
  const headers: AxiosRequestConfig['headers'] = {
    ...axiosConfig.headers,
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
  axiosConfig.headers = headers
  axiosConfig.adapter = 'fetch'
  axiosConfig.responseType = 'stream'

  const controller = new AbortController()
  axiosConfig.signal = controller.signal

  const response = await axiosInstance.request(axiosConfig)

  // Set up a reader for the response
  const reader = response.data.getReader()
  const decoder = new TextDecoder('utf-8')

  let isDone = false

  const onEvent = (event: EventSourceMessage) => {
    try {
      const eventData = JSON.parse(event.data)
      whisper('event data is: ', eventData)

      onData?.(eventData)

      if (eventData.status === 'COMPLETED') {
        isDone = true
        controller.abort()

        if (eventData.success) {
          onEnd?.()
        } else {
          onError?.(eventData)
        }
      }
    } catch (e) {
      onError?.(e)
    }
  }

  const parser = createParser({
    onEvent
  })


  // Process the SSE stream
  while (true) {
    try {
      const { done, value } = await reader.read()

      if (done || isDone) {
        onEnd?.()
        break
      }

      const chunk = decoder.decode(value)
      parser.feed(chunk)
    } catch (error) {
      if ((error instanceof Error && error.name === 'CanceledError') || isDone || axios.isCancel(error)) {
        // do nothing
      } else {
        whisper('error is: ', error)
        onError?.(error)
      }
      break
    }
  }


  return response.data
}

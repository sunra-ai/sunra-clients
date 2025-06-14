import { AxiosRequestConfig } from 'axios'
import { RequiredConfig } from './config'
import { isBrowser } from './utils'
import packageInfo from '../package.json'

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

export async function dispatchRequest<Input, Output>(
  params: RequestParams<Input>,
): Promise<Output> {
  const { targetUrl, input, config } = params
  const { credentials: credentialsValue, proxyUrl, axios } = config
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

  const response = await axios.request(axiosConfig)
  return response.data
}

import { AxiosRequestConfig } from 'axios'
import { RequiredConfig } from './config'
import { SunraRunOptions, UrlOptions } from './types/common'
import { ensureEndpointIdFormat, isBrowser, isValidUrl, whisper } from './utils'
import packageInfo from '../package.json'

function getUserAgent(): string {
  return `${packageInfo.name}/${packageInfo.version}`
}


const isCloudflareWorkers =
  typeof navigator !== 'undefined' &&
  navigator?.userAgent === 'Cloudflare-Workers'

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
    ...(!isCloudflareWorkers && { mode: 'cors' }),
    data: input
  }

  whisper('axiosConfig is: ', axiosConfig)
  const response = await axios.request(axiosConfig)
  return response.data
}

/**
 * Builds the final url to run the function based on its `id` or alias and
 * a the options from `RunOptions<Input>`.
 *
 * @private
 * @param id the function id or alias
 * @param options the run options
 * @returns the final url to run the function
 */
export function buildUrl<Input>(
  id: string,
  options: SunraRunOptions<Input> & UrlOptions = {},
): string {
  const path = (options.path ?? '').replace(/^\//, '').replace(/\/{2,}/, '/')
  const params = {
    ...(options.query || {}),
  }

  const queryParams =
    Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : ''

  // if a sunra url is passed, just use it
  if (isValidUrl(id)) {
    const url = id.endsWith('/') ? id : `${id}/`
    return `${url}${path}${queryParams}`
  }

  const appId = ensureEndpointIdFormat(id)
  const domain = ['api.sunra.ai/v1', options.subdomain].filter(Boolean).join('/')
  const url = `https://${domain}/${appId}/${path}`
  return `${url.replace(/\/$/, '')}${queryParams}`
}

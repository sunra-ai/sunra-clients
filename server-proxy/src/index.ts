import { debug } from './utils'
import fetchToCurl from 'fetch-to-curl'
// import { HttpsProxyAgent } from 'https-proxy-agent'

export const TARGET_URL_HEADER = 'x-sunra-target-url'
export const DEFAULT_PROXY_ROUTE = '/api/sunra/proxy'

const SUNRA_KEY = process.env.SUNRA_KEY
const SUNRA_KEY_ID = process.env.SUNRA_KEY_ID
const SUNRA_KEY_SECRET = process.env.SUNRA_KEY_SECRET

export type HeaderValue = string | string[] | undefined | null;

// TODO: use a more specific regex
// const SUNRA_URL_REG_EXP = /(\.|^)sunra\.(run|ai)$/;
const SUNRA_URL_REG_EXP = /.*/

/**
 * The proxy behavior that is passed to the proxy handler. This is a subset of
 * request objects that are used by different frameworks, like Express and NextJS.
 */
export interface ProxyBehavior<ResponseType> {
  id: string;
  method: string;
   
  respondWith(status: number, data: string | any): ResponseType;
  sendResponse(response: Response): Promise<ResponseType>;
  getHeaders(): Record<string, HeaderValue>;
  getHeader(name: string): HeaderValue;
  sendHeader(name: string, value: string): void;
  getRequestBody(): Promise<string | undefined>;
  resolveApiKey?: () => Promise<string | undefined>;
}

/**
 * Utility to get a header value as `string` from a Headers object.
 *
 * @private
 * @param request the header value.
 * @returns the header value as `string` or `undefined` if the header is not set.
 */
function singleHeaderValue(value: HeaderValue): string | undefined {
  if (!value) {
    return undefined
  }
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function getSunraKey(): string | undefined {
  if (SUNRA_KEY) {
    return SUNRA_KEY
  }
  if (SUNRA_KEY_ID && SUNRA_KEY_SECRET) {
    return `${SUNRA_KEY_ID}:${SUNRA_KEY_SECRET}`
  }
  return undefined
}

const EXCLUDED_HEADERS = ['content-length', 'content-encoding']

/**
 * A request handler that proxies the request to the sunra API
 * endpoint. This is useful so client-side calls to the sunra endpoint
 * can be made without CORS issues and the correct credentials can be added
 * effortlessly.
 *
 * @param behavior the request proxy behavior.
 * @returns Promise<any> the promise that will be resolved once the request is done.
 */
export async function handleRequest<ResponseType>(
  behavior: ProxyBehavior<ResponseType>,
) {
  const targetUrl = singleHeaderValue(behavior.getHeader(TARGET_URL_HEADER))
  debug('targetUrl: ', targetUrl)
  if (!targetUrl) {
    return behavior.respondWith(400, `Missing the ${TARGET_URL_HEADER} header`)
  }

  const urlHost = new URL(targetUrl).host
  if (!SUNRA_URL_REG_EXP.test(urlHost)) {
    return behavior.respondWith(412, `Invalid ${TARGET_URL_HEADER} header`)
  }

  const sunraKey = behavior.resolveApiKey
    ? await behavior.resolveApiKey()
    : getSunraKey()
  if (!sunraKey) {
    return behavior.respondWith(401, 'Missing sunra credentials')
  }

  // pass over headers prefixed with x-sunra-*
  const headers: Record<string, HeaderValue> = {}
  Object.keys(behavior.getHeaders()).forEach((key) => {
    if (key.toLowerCase().startsWith('x-sunra-')) {
      headers[key.toLowerCase()] = behavior.getHeader(key)
    }
  })

  const proxyUserAgent = `@sunra/server-proxy/${behavior.id}`
  const userAgent = singleHeaderValue(behavior.getHeader('user-agent'))

  const realHeaders = {
    ...headers,
    authorization:
      singleHeaderValue(behavior.getHeader('authorization')) ??
      `Key ${sunraKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': userAgent,
    'x-sunra-client-proxy': proxyUserAgent,
  } as HeadersInit

  const body = behavior.method?.toUpperCase() === 'GET'
    ? undefined
    : await behavior.getRequestBody()

  const fetchParams = {
    method: behavior.method,
    headers: realHeaders,
    body
  }

  debug('fetch to curl: ', fetchToCurl(targetUrl, fetchParams))

  const res = await fetch(targetUrl, fetchParams)

  debug('response: ', res)

  // copy headers from sunra to the proxied response
  res.headers.forEach((value, key) => {
    if (!EXCLUDED_HEADERS.includes(key.toLowerCase())) {
      behavior.sendHeader(key, value)
    }
  })

  try {
    EXCLUDED_HEADERS.forEach((key) => {
      res.headers.delete(key)
    })
  } catch {
    // do nothing
  }

  return behavior.sendResponse(res)
}

export function fromHeaders(
  headers: Headers,
): Record<string, string | string[]> {
  // TODO once Header.entries() is available, use that instead
  // Object.fromEntries(headers.entries());
  const result: Record<string, string | string[]> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export const responsePassthrough = (res: Response) => Promise.resolve(res)

export const resolveApiKeyFromEnv = () => Promise.resolve(getSunraKey())

import { debug as createDebug } from 'debug'
export const debug = createDebug('sunra')

export function ensureEndpointIdFormat(id: string): string {
  if (!id) {
    return ''
  }

  const parts = id.split('/')
  if (parts.length > 1) {
    return id
  }
  const [, appOwner, appId] = /^([0-9]+)-([a-zA-Z0-9-]+)$/.exec(id) || []
  if (appOwner && appId) {
    return `${appOwner}/${appId}`
  }
  throw new Error(
    `Invalid app id: ${id}. Must be in the format <appOwner>/<appId>`,
  )
}

type EndpointId = {
  readonly owner: string;
  readonly alias: string;
  readonly path?: string;
};

export function parseEndpointId(id: string): EndpointId {
  const normalizedId = ensureEndpointIdFormat(id)
  const parts = normalizedId.split('/')
  return {
    owner: parts[0] as string,
    alias: parts[1] as string,
    path: parts.slice(2).join('/') || undefined,
  }
}

export function isValidUrl(url: string) {
  try {
    const { host } = new URL(url)
    return /(sunra\.(ai|run))$/.test(host)
  } catch {
    return false
  }
}

/**
 * Check if a value is a plain object.
 * @param value - The value to check.
 * @returns `true` if the value is a plain object, `false` otherwise.
 */
export function isPlainObject(value: any): boolean {
  return !!value && Object.getPrototypeOf(value) === Object.prototype
}

export const whisper = (formatStr: string, ...args: any[]) => {
  debug(formatStr, ...args)
}
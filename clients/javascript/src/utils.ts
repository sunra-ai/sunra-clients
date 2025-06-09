import { debug as createDebug } from 'debug'
export const debug = createDebug('sunra')

export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
  )
}

export const whisper = (formatStr: string, ...args: any[]) => {
  debug(formatStr, ...args)
}

/**
 * @returns the URL of the sunra REST api endpoint.
 */
export function getRestApiUrl(): string {
  return process.env.SUNRA_API_ENDPOINT ?? 'https://api.sunra.ai/v1'
}

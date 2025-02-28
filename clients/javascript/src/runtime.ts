import packageInfo from '../package.json'

export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
  )
}

let memoizedUserAgent: string | null = null

export function getUserAgent(): string {
  if (memoizedUserAgent !== null) {
    return memoizedUserAgent
  }
  memoizedUserAgent = `${packageInfo.name}/${packageInfo.version}`
  return memoizedUserAgent
}

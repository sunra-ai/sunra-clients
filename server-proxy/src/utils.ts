import { debug as createDebug } from 'debug'
const _debug = createDebug('sunra')
export const debug = (formatter: any, ...args: any[]) => {
  try {
    _debug(formatter, ...args)
  } catch {
    // do nothing
  }
}

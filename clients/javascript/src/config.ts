import { isBrowser } from './runtime'
import axios, { AxiosInstance } from 'axios'

type CredentialsResolver = () => string | undefined;

export type SunraClientConfig = {
  /**
   * The credentials to use for the sunra client. When using the
   * client in the browser, it's recommended to use a proxy server to avoid
   * exposing the credentials in the client's environment.
   *
   * By default it tries to use the `SUNRA_KEY` environment variable, when
   * `process.env` is defined.
   *
   * @see https://docs.sunra.ai/model-endpoints/server-side
   * @see #suppressLocalCredentialsWarning
   */
  credentials?: undefined | string | CredentialsResolver;
  /**
   * Suppresses the warning when the sunra credentials are exposed in the
   * browser's environment. Make sure you understand the security implications
   * before enabling this option.
   */
  suppressLocalCredentialsWarning?: boolean;
  /**
   * The URL of the proxy server to use for the client requests. The proxy
   * server should forward the requests to the sunra api.
   */
  proxyUrl?: string;
  /**
   * The fetch implementation to use for the client requests. By default it uses
   * the global `fetch` function.
   */
  axios?: AxiosInstance
};

export type RequiredConfig = Required<SunraClientConfig>;

export const credentialsFromEnv: CredentialsResolver = () => {
  if (typeof process === 'undefined' || !process.env) {
    return undefined
  }
  return process.env.SUNRA_KEY ?? undefined
}


/**
 * Configures the sunra client.
 *
 * @param config the new configuration.
 */
export function createConfig(config: SunraClientConfig): RequiredConfig {
  const configuration = { axios, ...config } as RequiredConfig

  const { credentials: resolveCredentials, suppressLocalCredentialsWarning } =
    configuration
  const credentials =
    typeof resolveCredentials === 'function'
      ? resolveCredentials()
      : resolveCredentials

  if (isBrowser() && credentials && !suppressLocalCredentialsWarning) {
    console.warn(
      'The sunra credentials are exposed in the browser\'s environment. ' +
      'That\'s not recommended for production use cases.',
    )
  }
  return configuration
}

/**
 * @returns the URL of the sunra REST api endpoint.
 */
export function getRestApiUrl(): string {
  return process.env.SUNRA_API_ENDPOINT ?? 'https://api.sunra.ai/v1'
}

import { sunra, SunraClient } from '@sunra/client';
import { MCPError } from '../types/index.js';

let currentApiKey: string | null = null;

/**
 * Gets the current Sunra client instance
 * @returns The Sunra client instance
 * @throws {MCPError} If no API key is configured
 */
export function getSunraClient(): SunraClient {
  if (!getCurrentApiKey()) {
    throw new MCPError(
      'NO_API_KEY',
      'Sunra API key is not configured. Please use the set-sunra-key tool to configure your API key.'
    );
  }
  return sunra;
}

/**
 * Sets the Sunra API key and creates a new client instance
 * @param apiKey - The API key to use
 */
export function setSunraApiKey(apiKey: string): void {
  currentApiKey = apiKey;
  sunra.config({ credentials: apiKey });
}

/**
 * Gets the current API key
 * @returns The current API key or null if not set
 */
export function getCurrentApiKey(): string | null {
  return currentApiKey ?? process.env.SUNRA_KEY ?? null;
}

/**
 * Checks if the client is configured
 * @returns True if the client is configured, false otherwise
 */
export function isClientConfigured(): boolean {
  return getCurrentApiKey() !== null;
}

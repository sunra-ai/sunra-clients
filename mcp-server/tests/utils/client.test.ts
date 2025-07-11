import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSunraClient, sunra } from '@sunra/client';
import {
  getSunraClient,
  setSunraApiKey,
  getCurrentApiKey,
  isClientConfigured,
} from '../../src/utils/client';
import { MCPError } from '../../src/types/index';

// Mock the Sunra client
vi.mock('@sunra/client');

describe('client utility functions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the module state
    vi.resetModules();

    // Clear environment variables
    delete process.env.SUNRA_KEY;

    // Re-import the module to reset its state
    await import('../../src/utils/client');
  });

  describe('getSunraClient', () => {
    it('should throw MCPError when no API key is configured', () => {
      expect(() => getSunraClient()).toThrow(MCPError);
      expect(() => getSunraClient()).toThrow('Sunra API key is not configured');
    });

    it('should return client when API key is configured', () => {
      const mockClient = { queue: {}, subscribe: vi.fn() };
      vi.mocked(createSunraClient).mockReturnValue(mockClient as any);

      setSunraApiKey('test-api-key');

      const client = getSunraClient();
      expect(client).toBe(sunra);
    });
  });

  describe('setSunraApiKey', () => {
    it('should create a new client with the provided API key', () => {
      const mockClient = { queue: {}, subscribe: vi.fn() };
      vi.mocked(createSunraClient).mockReturnValue(mockClient as any);

      setSunraApiKey('test-api-key');

      expect(sunra.config).toHaveBeenCalledWith({ credentials: 'test-api-key' });
    });

    it('should store the API key', () => {
      const mockClient = { queue: {}, subscribe: vi.fn() };
      vi.mocked(createSunraClient).mockReturnValue(mockClient as any);

      setSunraApiKey('test-api-key');

      expect(getCurrentApiKey()).toBe('test-api-key');
    });

    it('should update the client when called multiple times', () => {
      const mockClient1 = { queue: {}, subscribe: vi.fn() };
      const mockClient2 = { queue: {}, subscribe: vi.fn() };
      vi.mocked(createSunraClient)
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any);

      setSunraApiKey('api-key-1');
      setSunraApiKey('api-key-2');

      expect(sunra.config).toHaveBeenCalledWith({ credentials: 'api-key-1' });
      expect(sunra.config).toHaveBeenCalledWith({ credentials: 'api-key-2' });
      expect(getCurrentApiKey()).toBe('api-key-2');
    });
  });
});

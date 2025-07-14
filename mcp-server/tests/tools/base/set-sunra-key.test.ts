import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { setSunraKeyTool } from '../../../src/tools/base/set-sunra-key';
import { setSunraApiKey } from '../../../src/utils/client';
import { MCPError } from '../../../src/types/index';

// Mock the client utility
vi.mock('../../../src/utils/client');

describe('set-sunra-key tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(setSunraKeyTool.name).toBe('set-sunra-key');
      expect(setSunraKeyTool.description).toBe('Set the Sunra API key for authenticating with the Sunra.ai service');
    });

    it('should have valid zod schema for parameters', () => {
      expect(setSunraKeyTool.parameters).toBeDefined();
      expect(setSunraKeyTool.parameters).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('parameter validation', () => {
    it('should validate required apiKey parameter', () => {
      const result = setSunraKeyTool.parameters.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['apiKey'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should accept valid API key', () => {
      const validParams = {
        apiKey: 'sunra-api-key-123456789',
      };

      const result = setSunraKeyTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject empty API key', () => {
      const invalidParams = {
        apiKey: '',
      };

      const result = setSunraKeyTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject non-string API key', () => {
      const invalidParams = {
        apiKey: 123456,
      };

      const result = setSunraKeyTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should accept various API key formats', () => {
      const validApiKeys = [
        'sunra-api-key-123456789',
        'sk-1234567890abcdef',
        'sunra_key_abcdef123456',
        'API_KEY_WITH_UNDERSCORES',
        'simple-key',
        'a'.repeat(64), // Long key
      ];

      validApiKeys.forEach(apiKey => {
        const result = setSunraKeyTool.parameters.safeParse({ apiKey });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('execute function', () => {
    it('should successfully set API key', async () => {
      const args = {
        apiKey: 'sunra-api-key-123456789',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(setSunraApiKey).toHaveBeenCalledWith('sunra-api-key-123456789');

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Sunra API key configured successfully',
            keyPrefix: 'sunra-ap...',
          }, null, 2),
        }],
      });
    });

    it('should handle short API keys', async () => {
      const args = {
        apiKey: 'short',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(setSunraApiKey).toHaveBeenCalledWith('short');

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Sunra API key configured successfully',
            keyPrefix: 'short...',
          }, null, 2),
        }],
      });
    });

    it('should handle API keys shorter than 8 characters', async () => {
      const args = {
        apiKey: 'abc',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(setSunraApiKey).toHaveBeenCalledWith('abc');

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Sunra API key configured successfully',
            keyPrefix: 'abc...',
          }, null, 2),
        }],
      });
    });

    it('should handle long API keys', async () => {
      const longApiKey = 'sunra-api-key-1234567890abcdef-very-long-key-with-many-characters';
      const args = {
        apiKey: longApiKey,
      };

      const result = await setSunraKeyTool.execute(args);

      expect(setSunraApiKey).toHaveBeenCalledWith(longApiKey);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Sunra API key configured successfully',
            keyPrefix: 'sunra-ap...',
          }, null, 2),
        }],
      });
    });

    it('should handle different API key formats', async () => {
      const testCases = [
        {
          apiKey: 'sk-1234567890abcdef',
          expectedPrefix: 'sk-12345...',
        },
        {
          apiKey: 'sunra_key_abcdef123456',
          expectedPrefix: 'sunra_ke...',
        },
        {
          apiKey: 'API_KEY_WITH_UNDERSCORES',
          expectedPrefix: 'API_KEY_...',
        },
        {
          apiKey: 'simple-key',
          expectedPrefix: 'simple-k...',
        },
      ];

      for (const { apiKey, expectedPrefix } of testCases) {
        const args = { apiKey };
        const result = await setSunraKeyTool.execute(args);

        expect(setSunraApiKey).toHaveBeenCalledWith(apiKey);
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Sunra API key configured successfully',
              keyPrefix: expectedPrefix,
            }, null, 2),
          }],
        });
      }
    });

    it('should handle errors when setting API key', async () => {
      const error = new Error('Failed to configure client');
      vi.mocked(setSunraApiKey).mockImplementation(() => {
        throw error;
      });

      const args = {
        apiKey: 'sunra-api-key-123456789',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Failed to configure client',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle MCPError appropriately', async () => {
      const mcpError = new MCPError('INVALID_API_KEY', 'Invalid API key format');
      vi.mocked(setSunraApiKey).mockImplementation(() => {
        throw mcpError;
      });

      const args = {
        apiKey: 'invalid-key',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid API key format',
            code: 'INVALID_API_KEY',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle unknown error types', async () => {
      vi.mocked(setSunraApiKey).mockImplementation(() => {
        throw 'string error';
      });

      const args = {
        apiKey: 'sunra-api-key-123456789',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Unknown error occurred',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle null/undefined errors', async () => {
      vi.mocked(setSunraApiKey).mockImplementation(() => {
        throw null;
      });

      const args = {
        apiKey: 'sunra-api-key-123456789',
      };

      const result = await setSunraKeyTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Unknown error occurred',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should not expose full API key in logs or responses', async () => {
      const sensitiveApiKey = 'sunra-api-key-super-secret-12345678901234567890';
      const args = {
        apiKey: sensitiveApiKey,
      };

      const result = await setSunraKeyTool.execute(args);

      // Check that the full API key is not exposed in the response
      const responseText = result.content[0].text;
      expect(responseText).not.toContain(sensitiveApiKey);
      expect(responseText).toContain('sunra-ap...');
    });
  });
});

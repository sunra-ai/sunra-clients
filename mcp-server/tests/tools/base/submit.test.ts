import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { submitTool } from '../../../src/tools/base/submit';
import { getSunraClient } from '../../../src/utils/client';
import { MCPError } from '../../../src/types/index';

// Mock the client utility
vi.mock('../../../src/utils/client');

describe('submit tool', () => {
  const mockClient = {
    queue: {
      submit: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSunraClient).mockReturnValue(mockClient as any);
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(submitTool.name).toBe('submit');
      expect(submitTool.description).toBe('Submit a request to the Sunra queue for processing');
    });

    it('should have valid zod schema for parameters', () => {
      expect(submitTool.parameters).toBeDefined();
      expect(submitTool.parameters).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('parameter validation', () => {
    it('should validate required endpointId parameter', () => {
      const result = submitTool.parameters.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['endpointId'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should accept valid parameters', () => {
      const validParams = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test' },
        webhookUrl: 'https://example.com/webhook',
      };

      const result = submitTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject invalid webhook URL', () => {
      const invalidParams = {
        endpointId: 'test-endpoint',
        webhookUrl: 'not-a-url',
      };

      const result = submitTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('execute function', () => {
    it('should successfully submit a request', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'IN_QUEUE',
        queue_position: 1,
        response_url: 'https://api.sunra.ai/queue/req-123',
      };

      mockClient.queue.submit.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await submitTool.execute(args);

      expect(mockClient.queue.submit).toHaveBeenCalledWith('test-endpoint', {
        input: { prompt: 'test prompt' },
        webhookUrl: undefined,
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            status: 'IN_QUEUE',
            queuePosition: 1,
            responseUrl: 'https://api.sunra.ai/queue/req-123',
          }, null, 2),
        }],
      });
    });

    it('should submit a request with webhook URL', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'IN_QUEUE',
        queue_position: 1,
        response_url: 'https://api.sunra.ai/queue/req-123',
      };

      mockClient.queue.submit.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
        webhookUrl: 'https://example.com/webhook',
      };

      await submitTool.execute(args);

      expect(mockClient.queue.submit).toHaveBeenCalledWith('test-endpoint', {
        input: { prompt: 'test prompt' },
        webhookUrl: 'https://example.com/webhook',
      });
    });

    it('should handle MCPError appropriately', async () => {
      const mcpError = new MCPError('NO_API_KEY', 'API key not configured');
      vi.mocked(getSunraClient).mockImplementation(() => {
        throw mcpError;
      });

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await submitTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'API key not configured',
            code: 'NO_API_KEY',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Network error');
      mockClient.queue.submit.mockRejectedValue(genericError);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await submitTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Network error',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle unknown error types', async () => {
      mockClient.queue.submit.mockRejectedValue('string error');

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await submitTool.execute(args);

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

    it('should handle request without input', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'IN_QUEUE',
        queue_position: 1,
        response_url: 'https://api.sunra.ai/queue/req-123',
      };

      mockClient.queue.submit.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
      };

      await submitTool.execute(args);

      expect(mockClient.queue.submit).toHaveBeenCalledWith('test-endpoint', {
        input: undefined,
        webhookUrl: undefined,
      });
    });
  });
});

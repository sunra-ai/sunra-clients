import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { subscribeTool } from '../../../src/tools/base/subscribe';
import { getSunraClient } from '../../../src/utils/client';
import { MCPError } from '../../../src/types/index';

// Mock the client utility
vi.mock('../../../src/utils/client');

describe('subscribe tool', () => {
  const mockClient = {
    subscribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSunraClient).mockReturnValue(mockClient as any);
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(subscribeTool.name).toBe('subscribe');
      expect(subscribeTool.description).toBe('Submit a request to the Sunra queue and wait for completion');
    });

    it('should have valid zod schema for parameters', () => {
      expect(subscribeTool.parameters).toBeDefined();
      expect(subscribeTool.parameters).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('parameter validation', () => {
    it('should validate required endpointId parameter', () => {
      const result = subscribeTool.parameters.safeParse({});
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

    it('should accept valid parameters with all options', () => {
      const validParams = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test' },
        mode: 'polling' as const,
        pollInterval: 2000,
        timeout: 60000,
        logs: true,
        webhookUrl: 'https://example.com/webhook',
      };

      const result = subscribeTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should accept minimal valid parameters', () => {
      const validParams = {
        endpointId: 'test-endpoint',
      };

      const result = subscribeTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate mode enum values', () => {
      const invalidParams = {
        endpointId: 'test-endpoint',
        mode: 'invalid-mode',
      };

      const result = subscribeTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should validate webhook URL format', () => {
      const invalidParams = {
        endpointId: 'test-endpoint',
        webhookUrl: 'not-a-url',
      };

      const result = subscribeTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should validate numeric parameters', () => {
      const invalidParams = {
        endpointId: 'test-endpoint',
        pollInterval: 'not-a-number',
        timeout: 'not-a-number',
      };

      const result = subscribeTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('execute function', () => {
    it('should successfully submit and wait for completion', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: {
          images: ['https://example.com/image1.jpg'],
          metadata: {
            model: 'flux-1-dev',
            inference_time: 3.2,
          },
        },
      };

      mockClient.subscribe.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await subscribeTool.execute(args);

      expect(mockClient.subscribe).toHaveBeenCalledWith('test-endpoint', {
        input: { prompt: 'test prompt' },
        mode: undefined,
        pollInterval: undefined,
        timeout: undefined,
        logs: undefined,
        webhookUrl: undefined,
        onEnqueue: expect.any(Function),
        onQueueUpdate: expect.any(Function),
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            data: {
              images: ['https://example.com/image1.jpg'],
              metadata: {
                model: 'flux-1-dev',
                inference_time: 3.2,
              },
            },
          }, null, 2),
        }],
      });
    });

    it('should handle all subscription parameters', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: { result: 'success' },
      };

      mockClient.subscribe.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
        mode: 'streaming' as const,
        pollInterval: 2000,
        timeout: 60000,
        logs: true,
        webhookUrl: 'https://example.com/webhook',
      };

      await subscribeTool.execute(args);

      expect(mockClient.subscribe).toHaveBeenCalledWith('test-endpoint', {
        input: { prompt: 'test prompt' },
        mode: 'streaming',
        pollInterval: 2000,
        timeout: 60000,
        logs: true,
        webhookUrl: 'https://example.com/webhook',
        onEnqueue: expect.any(Function),
        onQueueUpdate: expect.any(Function),
      });
    });

    it('should handle subscription without input', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: { result: 'success' },
      };

      mockClient.subscribe.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
      };

      await subscribeTool.execute(args);

      expect(mockClient.subscribe).toHaveBeenCalledWith('test-endpoint', {
        input: undefined,
        mode: undefined,
        pollInterval: undefined,
        timeout: undefined,
        logs: undefined,
        webhookUrl: undefined,
        onEnqueue: expect.any(Function),
        onQueueUpdate: expect.any(Function),
      });
    });

    it('should handle onEnqueue callback', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const mockResponse = {
        requestId: 'req-123',
        data: { result: 'success' },
      };

      mockClient.subscribe.mockImplementation(async (endpointId, options) => {
        // Simulate onEnqueue callback
        if (options.onEnqueue) {
          options.onEnqueue('req-123');
        }
        return mockResponse;
      });

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      await subscribeTool.execute(args);

      expect(consoleSpy).toHaveBeenCalledWith('Request req-123 enqueued');

      consoleSpy.mockRestore();
    });

    it('should handle onQueueUpdate callback', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const mockResponse = {
        requestId: 'req-123',
        data: { result: 'success' },
      };

      mockClient.subscribe.mockImplementation(async (endpointId, options) => {
        // Simulate onQueueUpdate callback
        if (options.onQueueUpdate) {
          options.onQueueUpdate({ status: 'IN_PROGRESS' });
        }
        return mockResponse;
      });

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      await subscribeTool.execute(args);

      expect(consoleSpy).toHaveBeenCalledWith('Queue update: IN_PROGRESS');

      consoleSpy.mockRestore();
    });

    it('should handle complex result data', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: {
          audio: 'https://example.com/audio.wav',
          transcript: 'Test transcript',
          segments: [
            { start: 0, end: 1, text: 'Test' },
            { start: 1, end: 2, text: 'transcript' },
          ],
        },
      };

      mockClient.subscribe.mockResolvedValue(mockResponse);

      const args = {
        endpointId: 'test-endpoint',
        input: { audio_url: 'https://example.com/input.wav' },
      };

      const result = await subscribeTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            data: {
              audio: 'https://example.com/audio.wav',
              transcript: 'Test transcript',
              segments: [
                { start: 0, end: 1, text: 'Test' },
                { start: 1, end: 2, text: 'transcript' },
              ],
            },
          }, null, 2),
        }],
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

      const result = await subscribeTool.execute(args);

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
      mockClient.subscribe.mockRejectedValue(genericError);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await subscribeTool.execute(args);

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

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockClient.subscribe.mockRejectedValue(timeoutError);

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
        timeout: 5000,
      };

      const result = await subscribeTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Request timeout',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle unknown error types', async () => {
      mockClient.subscribe.mockRejectedValue('string error');

      const args = {
        endpointId: 'test-endpoint',
        input: { prompt: 'test prompt' },
      };

      const result = await subscribeTool.execute(args);

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
  });
});

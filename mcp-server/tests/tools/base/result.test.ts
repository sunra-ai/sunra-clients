import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { resultTool } from '../../../src/tools/base/result';
import { getSunraClient } from '../../../src/utils/client';
import { MCPError } from '../../../src/types/index';

// Mock the client utility
vi.mock('../../../src/utils/client');

describe('result tool', () => {
  const mockClient = {
    queue: {
      result: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSunraClient).mockReturnValue(mockClient as any);
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(resultTool.name).toBe('result');
      expect(resultTool.description).toBe('Retrieve the result of a completed request from the Sunra queue');
    });

    it('should have valid zod schema for parameters', () => {
      expect(resultTool.parameters).toBeDefined();
      expect(resultTool.parameters).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('parameter validation', () => {
    it('should validate required requestId parameter', () => {
      const result = resultTool.parameters.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['requestId'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should accept valid parameters', () => {
      const validParams = {
        requestId: 'req-123',
      };

      const result = resultTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject empty requestId', () => {
      const invalidParams = {
        requestId: '',
      };

      const result = resultTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('execute function', () => {
    it('should successfully retrieve result data', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: {
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          metadata: {
            model: 'flux-1-dev',
            inference_time: 2.5,
          },
        },
      };

      mockClient.queue.result.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

      expect(mockClient.queue.result).toHaveBeenCalledWith({
        requestId: 'req-123',
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            data: {
              images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
              metadata: {
                model: 'flux-1-dev',
                inference_time: 2.5,
              },
            },
          }, null, 2),
        }],
      });
    });

    it('should handle simple text result', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: 'Hello, world!',
      };

      mockClient.queue.result.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            data: 'Hello, world!',
          }, null, 2),
        }],
      });
    });

    it('should handle complex nested result data', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: {
          result: {
            audio: 'https://example.com/audio.wav',
            transcript: 'This is a test transcript',
            confidence: 0.95,
            segments: [
              { start: 0, end: 1.5, text: 'This is' },
              { start: 1.5, end: 3.0, text: 'a test' },
              { start: 3.0, end: 4.5, text: 'transcript' },
            ],
          },
        },
      };

      mockClient.queue.result.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            data: {
              result: {
                audio: 'https://example.com/audio.wav',
                transcript: 'This is a test transcript',
                confidence: 0.95,
                segments: [
                  { start: 0, end: 1.5, text: 'This is' },
                  { start: 1.5, end: 3.0, text: 'a test' },
                  { start: 3.0, end: 4.5, text: 'transcript' },
                ],
              },
            },
          }, null, 2),
        }],
      });
    });

    it('should handle null or undefined result data', async () => {
      const mockResponse = {
        requestId: 'req-123',
        data: null,
      };

      mockClient.queue.result.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            data: null,
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
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

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
      const genericError = new Error('Request not found');
      mockClient.queue.result.mockRejectedValue(genericError);

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Request not found',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle API errors (e.g., request not completed)', async () => {
      const apiError = new Error('Request is still processing');
      mockClient.queue.result.mockRejectedValue(apiError);

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Request is still processing',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle unknown error types', async () => {
      mockClient.queue.result.mockRejectedValue('string error');

      const args = {
        requestId: 'req-123',
      };

      const result = await resultTool.execute(args);

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

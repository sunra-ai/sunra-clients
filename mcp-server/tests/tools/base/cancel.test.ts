import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { cancelTool } from '../../../src/tools/base/cancel';
import { getSunraClient } from '../../../src/utils/client';
import { MCPError } from '../../../src/types/index';

// Mock the client utility
vi.mock('../../../src/utils/client');

describe('cancel tool', () => {
  const mockClient = {
    queue: {
      cancel: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSunraClient).mockReturnValue(mockClient as any);
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(cancelTool.name).toBe('cancel');
      expect(cancelTool.description).toBe('Cancel a request in the Sunra queue');
    });

    it('should have valid zod schema for parameters', () => {
      expect(cancelTool.parameters).toBeDefined();
      expect(cancelTool.parameters).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('parameter validation', () => {
    it('should validate required requestId parameter', () => {
      const result = cancelTool.parameters.safeParse({});
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

      const result = cancelTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject empty requestId', () => {
      const invalidParams = {
        requestId: '',
      };

      const result = cancelTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject non-string requestId', () => {
      const invalidParams = {
        requestId: 123,
      };

      const result = cancelTool.parameters.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('execute function', () => {
    it('should successfully cancel a request', async () => {
      // Mock the cancel function to resolve successfully
      mockClient.queue.cancel.mockResolvedValue(undefined);

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

      expect(mockClient.queue.cancel).toHaveBeenCalledWith({
        requestId: 'req-123',
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            message: 'Request cancelled successfully',
          }, null, 2),
        }],
      });
    });

    it('should handle different request ID formats', async () => {
      mockClient.queue.cancel.mockResolvedValue(undefined);

      const testCases = [
        'req-123',
        'request_456',
        'uuid-1234-5678-9012',
        'simple-id',
      ];

      for (const requestId of testCases) {
        const args = { requestId };
        const result = await cancelTool.execute(args);

        expect(mockClient.queue.cancel).toHaveBeenCalledWith({ requestId });
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              requestId,
              message: 'Request cancelled successfully',
            }, null, 2),
          }],
        });
      }
    });

    it('should handle MCPError appropriately', async () => {
      const mcpError = new MCPError('NO_API_KEY', 'API key not configured');
      vi.mocked(getSunraClient).mockImplementation(() => {
        throw mcpError;
      });

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

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
      mockClient.queue.cancel.mockRejectedValue(genericError);

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

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

    it('should handle API errors (e.g., request already completed)', async () => {
      const apiError = new Error('Cannot cancel: request already completed');
      mockClient.queue.cancel.mockRejectedValue(apiError);

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Cannot cancel: request already completed',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockClient.queue.cancel.mockRejectedValue(networkError);

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Network timeout',
            code: 'UNKNOWN_ERROR',
          }, null, 2),
        }],
        isError: true,
      });
    });

    it('should handle unknown error types', async () => {
      mockClient.queue.cancel.mockRejectedValue('string error');

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

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
      mockClient.queue.cancel.mockRejectedValue(null);

      const args = {
        requestId: 'req-123',
      };

      const result = await cancelTool.execute(args);

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

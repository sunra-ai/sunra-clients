import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { statusTool } from '../../../src/tools/base/status';
import { getSunraClient } from '../../../src/utils/client';
import { MCPError } from '../../../src/types/index';

// Mock the client utility
vi.mock('../../../src/utils/client');

describe('status tool', () => {
  const mockClient = {
    queue: {
      status: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSunraClient).mockReturnValue(mockClient as any);
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(statusTool.name).toBe('status');
      expect(statusTool.description).toBe('Check the status of a request in the Sunra queue');
    });

    it('should have valid zod schema for parameters', () => {
      expect(statusTool.parameters).toBeDefined();
      expect(statusTool.parameters).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('parameter validation', () => {
    it('should validate required requestId parameter', () => {
      const result = statusTool.parameters.safeParse({});
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
        logs: true,
      };

      const result = statusTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should accept parameters without logs', () => {
      const validParams = {
        requestId: 'req-123',
      };

      const result = statusTool.parameters.safeParse(validParams);
      expect(result.success).toBe(true);
    });
  });

  describe('execute function', () => {
    it('should successfully get status for IN_QUEUE request', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'IN_QUEUE',
        queue_position: 5,
        response_url: 'https://api.sunra.ai/queue/req-123',
      };

      mockClient.queue.status.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
        logs: false,
      };

      const result = await statusTool.execute(args);

      expect(mockClient.queue.status).toHaveBeenCalledWith({
        requestId: 'req-123',
        logs: false,
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            status: 'IN_QUEUE',
            responseUrl: 'https://api.sunra.ai/queue/req-123',
            queuePosition: 5,
          }, null, 2),
        }],
      });
    });

    it('should successfully get status for IN_PROGRESS request with logs', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'IN_PROGRESS',
        response_url: 'https://api.sunra.ai/queue/req-123',
        logs: 'Processing image...',
      };

      mockClient.queue.status.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
        logs: true,
      };

      const result = await statusTool.execute(args);

      expect(mockClient.queue.status).toHaveBeenCalledWith({
        requestId: 'req-123',
        logs: true,
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            status: 'IN_PROGRESS',
            responseUrl: 'https://api.sunra.ai/queue/req-123',
            logs: 'Processing image...',
          }, null, 2),
        }],
      });
    });

    it('should successfully get status for COMPLETED request with metrics', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'COMPLETED',
        response_url: 'https://api.sunra.ai/queue/req-123',
        metrics: {
          inference_time: 2.5,
        },
      };

      mockClient.queue.status.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
        logs: false,
      };

      const result = await statusTool.execute(args);

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            requestId: 'req-123',
            status: 'COMPLETED',
            responseUrl: 'https://api.sunra.ai/queue/req-123',
            metrics: {
              inference_time: 2.5,
            },
          }, null, 2),
        }],
      });
    });

    it('should default logs to false when not specified', async () => {
      const mockResponse = {
        request_id: 'req-123',
        status: 'IN_QUEUE',
        queue_position: 1,
        response_url: 'https://api.sunra.ai/queue/req-123',
      };

      mockClient.queue.status.mockResolvedValue(mockResponse);

      const args = {
        requestId: 'req-123',
      };

      await statusTool.execute(args);

      expect(mockClient.queue.status).toHaveBeenCalledWith({
        requestId: 'req-123',
        logs: false,
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

      const result = await statusTool.execute(args);

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
      mockClient.queue.status.mockRejectedValue(genericError);

      const args = {
        requestId: 'req-123',
      };

      const result = await statusTool.execute(args);

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

    it('should handle unknown error types', async () => {
      mockClient.queue.status.mockRejectedValue('string error');

      const args = {
        requestId: 'req-123',
      };

      const result = await statusTool.execute(args);

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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listModelsTool } from '../../../src/tools/base/list-models';
import { MCPError } from '../../../src/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('listModelsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(listModelsTool.name).toBe('list-models');
    });

    it('should have description', () => {
      expect(listModelsTool.description).toBe('List all available AI models from the Sunra API');
    });

    it('should have parameters schema', () => {
      expect(listModelsTool.parameters).toBeDefined();
    });
  });

  describe('successful execution', () => {
    it('should fetch models with default limit', async () => {
      const mockModels = [
        { id: 'model1', name: 'Test Model 1', provider: 'Provider1' },
        { id: 'model2', name: 'Test Model 2', provider: 'Provider2' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await listModelsTool.execute({});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=9999',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.total).toBe(2);
      expect(parsedResponse.models).toEqual(mockModels);
    });

    it('should fetch models with custom limit', async () => {
      const mockModels = [
        { id: 'model1', name: 'Test Model 1', provider: 'Provider1' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await listModelsTool.execute({ limit: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=1',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.total).toBe(1);
      expect(parsedResponse.models).toEqual(mockModels);
    });

    it('should handle wrapped response format', async () => {
      const mockModels = [
        { id: 'model1', name: 'Test Model 1', provider: 'Provider1' },
      ];
      const wrappedResponse = {
        total: 1,
        models: mockModels,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(wrappedResponse),
      });

      const result = await listModelsTool.execute({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.total).toBe(1);
      expect(parsedResponse.models).toEqual(wrappedResponse);
    });

    it('should handle zero limit', async () => {
      const mockModels = [];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await listModelsTool.execute({ limit: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=0',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.total).toBe(0);
      expect(parsedResponse.models).toEqual(mockModels);
    });

    it('should handle large limit values', async () => {
      const mockModels = Array.from({ length: 1000 }, (_, i) => ({
        id: `model${i}`,
        name: `Test Model ${i}`,
        provider: `Provider${i % 3}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await listModelsTool.execute({ limit: 10000 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=10000',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.total).toBe(1000);
      expect(parsedResponse.models).toHaveLength(1000);
    });
  });

  describe('error handling', () => {
    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await listModelsTool.execute({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('HTTP 401: Unauthorized');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await listModelsTool.execute({});

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Network error');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await listModelsTool.execute({});

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Invalid JSON');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await listModelsTool.execute({});

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Network error');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValue('Unknown error string');

      const result = await listModelsTool.execute({});

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Unknown error occurred');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('parameter validation', () => {
    it('should accept valid limit parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await listModelsTool.execute({ limit: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=50',
        expect.any(Object)
      );

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
    });

    it('should use default limit when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await listModelsTool.execute({});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=9999',
        expect.any(Object)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle zero limit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await listModelsTool.execute({ limit: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=0',
        expect.any(Object)
      );

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
    });

    it('should handle very large limit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await listModelsTool.execute({ limit: 999999 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=999999',
        expect.any(Object)
      );

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
    });

    it('should handle API response with null or undefined values', async () => {
      const mockModels = [
        { id: 'model1', name: null, provider: undefined },
        { id: null, name: 'Test Model', provider: 'Provider' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await listModelsTool.execute({});

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.models).toEqual(mockModels);
    });
  });
});

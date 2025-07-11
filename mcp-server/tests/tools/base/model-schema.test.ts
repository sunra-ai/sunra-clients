import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modelSchemaTool } from '../../../src/tools/base/model-schema';
import { MCPError } from '../../../src/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('modelSchemaTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(modelSchemaTool.name).toBe('model-schema');
    });

    it('should have description', () => {
      expect(modelSchemaTool.description).toBe('Get the JSON schema for a specific AI model from its OpenAPI specification URL');
    });

    it('should have parameters schema', () => {
      expect(modelSchemaTool.parameters).toBeDefined();
    });
  });

  describe('successful execution', () => {
    const mockModels = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Advanced language model',
        provider: 'OpenAI',
        openapi: 'https://api.openai.com/v1/models/gpt-4/openapi.json',
      },
      {
        id: 'dall-e-2',
        name: 'DALL·E 2',
        description: 'AI image generation model',
        provider: 'OpenAI',
        openapi: 'https://api.openai.com/v1/models/dall-e-2/openapi.json',
      },
    ];

    const mockSchema = {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The input prompt',
        },
        max_tokens: {
          type: 'integer',
          description: 'Maximum tokens to generate',
        },
      },
      required: ['prompt'],
    };

    it('should fetch schema for existing model', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModels),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSchema),
        });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.sunra.ai/v1/models?limit=9999',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.openai.com/v1/models/gpt-4/openapi.json',
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
      expect(parsedResponse.modelId).toBe('gpt-4');
      expect(parsedResponse.schema).toEqual(mockSchema);
    });

    it('should use model ID as name when name is not available', async () => {
      const modelsWithoutName = [
        {
          id: 'test-model',
          openapi: 'https://example.com/test-schema.json',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(modelsWithoutName),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      });

      const result = await modelSchemaTool.execute({ modelId: 'test-model' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.modelName).toBe('test-model');
    });

    it('should handle models wrapped in response object', async () => {
      const mockResponse = {
        models: mockModels,
        total: mockModels.length,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.modelId).toBe('gpt-4');
    });

    it('should handle complex schema structures', async () => {
      const complexSchema = {
        openapi: '3.0.0',
        info: { title: 'Complex API', version: '2.0.0' },
        components: {
          schemas: {
            ComplexType: {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  properties: {
                    array: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Reference' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(complexSchema),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.schema).toEqual(complexSchema);
    });
  });

  describe('error handling', () => {

    it('should handle model not found', async () => {
      const mockModels = [
        { id: 'other-model', openapi: 'https://example.com/other.json' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelId: 'nonexistent-model' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe("Model with ID 'nonexistent-model' not found");
      expect(parsedResponse.code).toBe('MODEL_NOT_FOUND');
    });

    it('should handle model without OpenAPI URL', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4' }, // No openapi field
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe("Model 'gpt-4' does not have an OpenAPI specification URL");
      expect(parsedResponse.code).toBe('NO_OPENAPI_URL');
    });

    it('should handle HTTP error when fetching models', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Failed to fetch models: HTTP 401: Unauthorized');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle HTTP error when fetching schema', async () => {
      const mockModels = [
        { id: 'gpt-4', openapi: 'https://example.com/gpt-4-schema.json' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Failed to fetch schema: HTTP 404: Not Found');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Network error');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle JSON parsing errors in models response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON in models')),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Invalid JSON in models');
    });

    it('should handle JSON parsing errors in schema response', async () => {
      const mockModels = [
        { id: 'gpt-4', openapi: 'https://example.com/gpt-4-schema.json' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON in schema')),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Invalid JSON in schema');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Network error');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValue('String error');

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Unknown error occurred');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('edge cases', () => {
    it('should handle empty models array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe("Model with ID 'gpt-4' not found");
      expect(parsedResponse.code).toBe('MODEL_NOT_FOUND');
    });

    it('should handle models with null openapi field', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', openapi: null },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.code).toBe('NO_OPENAPI_URL');
    });

    it('should handle models with empty string openapi field', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', openapi: '' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelId: 'gpt-4' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.code).toBe('NO_OPENAPI_URL');
    });

    it('should handle very large schema documents', async () => {
      const mockModels = [
        { id: 'large-model', openapi: 'https://example.com/large-schema.json' },
      ];

      const largeSchema = {
        openapi: '3.0.0',
        paths: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [
            `/endpoint${i}`,
            { get: { summary: `Endpoint ${i}` } },
          ])
        ),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeSchema),
      });

      const result = await modelSchemaTool.execute({ modelId: 'large-model' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(Object.keys(parsedResponse.schema.paths)).toHaveLength(1000);
    });

    it('should handle special characters in model ID', async () => {
      const mockModels = [
        { id: 'model-with-special-chars_123', openapi: 'https://example.com/schema.json' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ openapi: '3.0.0' }),
      });

      const result = await modelSchemaTool.execute({ modelId: 'model-with-special-chars_123' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.modelId).toBe('model-with-special-chars_123');
    });
  });
});

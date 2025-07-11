import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchModelsTool } from '../../../src/tools/base/search-models';
import { MCPError } from '../../../src/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('searchModelsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(searchModelsTool.name).toBe('search-models');
    });

    it('should have description', () => {
      expect(searchModelsTool.description).toBe('Search for AI models by keywords in their names, descriptions, or aliases');
    });

    it('should have parameters schema', () => {
      expect(searchModelsTool.parameters).toBeDefined();
    });
  });

  describe('successful execution', () => {
    const mockModels = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Advanced language model',
        provider: 'OpenAI',
        category: 'text-generation',
        tags: ['chat', 'completion'],
        aliases: ['gpt4'],
      },
      {
        id: 'dall-e-2',
        name: 'DALL·E 2',
        description: 'AI image generation model',
        provider: 'OpenAI',
        category: 'image-generation',
        tags: ['image', 'art'],
        aliases: ['dalle2'],
      },
      {
        id: 'claude-3',
        name: 'Claude 3',
        description: 'Anthropic language model',
        provider: 'Anthropic',
        category: 'text-generation',
        tags: ['chat', 'assistant'],
        aliases: ['claude'],
      },
    ];

    it('should search models by name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'GPT-4' });

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
      expect(parsedResponse.keywords).toBe('GPT-4');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(1);
      expect(parsedResponse.data).toHaveLength(1);
      expect(parsedResponse.data[0].id).toBe('gpt-4');
    });

    it('should search models by description', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'language model' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('language model');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(3);
      expect(parsedResponse.data.map((m: any) => m.id)).toEqual(['gpt-4', 'dall-e-2', 'claude-3']);
    });

    it('should search models by provider', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'OpenAI' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('OpenAI');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(2);
      expect(parsedResponse.data.map((m: any) => m.id)).toEqual(['gpt-4', 'dall-e-2']);
    });

    it('should search models by aliases', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'claude3' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('claude3');
    });

    it('should search models by tags', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'image' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('image');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(1);
      expect(parsedResponse.data[0].id).toBe('dall-e-2');
    });

    it('should handle multiple keywords (OR search)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'Claude assistant' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('Claude assistant');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(1);
      expect(parsedResponse.data[0].id).toBe('claude-3');
    });

    it('should handle case-insensitive search', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'openai' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('openai');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(2);
      expect(parsedResponse.data.map((m: any) => m.id)).toEqual(['gpt-4', 'dall-e-2']);
    });

    it('should return empty results when no matches found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'nonexistent' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('nonexistent');
      expect(parsedResponse.totalSearched).toBe(3);
      expect(parsedResponse.found).toBe(0);
      expect(parsedResponse.data).toEqual([]);
    });

    it('should handle models with missing fields', async () => {
      const incompleteModels = [
        { id: 'model1' },
        { id: 'model2', name: 'Test Model' },
        { id: 'model3', name: null, description: undefined },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(incompleteModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'model' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.data.length).toBe(3); // Should find all models by id
    });

    it('should handle API response with models wrapper object', async () => {
      const mockResponse = {
        models: mockModels,
        total: mockModels.length,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchModelsTool.execute({ keywords: 'OpenAI' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
    });

    it('should handle custom limit parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({
        keywords: 'OpenAI',
        limit: 100,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sunra.ai/v1/models?limit=100',
        expect.any(Object)
      );

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
    });
  });



  describe('edge cases', () => {
    it('should handle empty models array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await searchModelsTool.execute({ keywords: 'test' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe('test');
      expect(parsedResponse.totalSearched).toBe(0);
      expect(parsedResponse.found).toBe(0);
      expect(parsedResponse.data).toEqual([]);
    });

    it('should handle single character keywords', async () => {
      const mockModels = [
        { id: 'a-model', name: 'A Model' },
        { id: 'b-model', name: 'B Model' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'a' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.found).toBe(1);
    });

    it('should handle very long keywords', async () => {
      const longKeyword = 'a'.repeat(1000);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await searchModelsTool.execute({ keywords: longKeyword });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.keywords).toBe(longKeyword);
    });

    it('should handle special characters in keywords', async () => {
      const mockModels = [
        { id: 'model-1', name: 'Model-1 (Beta)' },
        { id: 'model_2', name: 'Model_2 [Alpha]' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: 'Model-1 (Beta)' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.found).toBe(1);
    });

    it('should handle keywords with multiple spaces', async () => {
      const mockModels = [
        { id: 'gpt-4', description: 'Large language model' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await searchModelsTool.execute({ keywords: '  large    language   ' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.found).toBe(1);
    });
  });
});

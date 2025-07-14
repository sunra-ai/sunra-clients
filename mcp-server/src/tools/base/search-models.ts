import { z } from 'zod';
import { MCPError } from '../../types/index.js';

const searchModelsSchema = z.object({
  keywords: z.string().min(1).describe('Keywords to search for in model names, descriptions, or aliases'),
  limit: z.number().optional().describe('Maximum number of models to fetch before filtering (default: 9999)'),
});

export const searchModelsTool = {
  name: 'search-models',
  description: 'Search for AI models by keywords in their names, descriptions, or aliases',
  parameters: searchModelsSchema,
  execute: async (args: z.infer<typeof searchModelsSchema>) => {
    try {
      const limit = args.limit ?? 9999;
      const response = await fetch(`https://api.sunra.ai/v1/models?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const allModels = await response.json();
      const models = Array.isArray(allModels) ? allModels : (allModels.data || []);

      // Filter models by keywords
      const keywords = args.keywords.toLowerCase().split(/\s+/);
      const filteredModels = models.filter((model: any) => {
        const searchableText = [
          model.id || '',
          model.name || '',
          model.description || '',
          model.alias || '',
          ...(model.aliases || []),
          model.provider || '',
          model.category || '',
          ...(model.tags || []),
        ].join(' ').toLowerCase();

        return keywords.some(keyword => searchableText.includes(keyword));
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              keywords: args.keywords,
              totalSearched: models.length,
              found: filteredModels.length,
              data: filteredModels,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              code: error instanceof MCPError ? error.code : 'UNKNOWN_ERROR',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};

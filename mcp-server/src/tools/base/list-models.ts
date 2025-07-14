import { z } from 'zod';
import { MCPError } from '../../types/index.js';

const listModelsSchema = z.object({
  limit: z.number().optional().describe('Maximum number of models to return (default: 9999)'),
});

export const listModelsTool = {
  name: 'list-models',
  description: 'List all available AI models from the Sunra API',
  parameters: listModelsSchema,
  execute: async (args: z.infer<typeof listModelsSchema>) => {
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

      const models = await response.json();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              total: Array.isArray(models) ? models.length : (models.total || 0),
              models: models,
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

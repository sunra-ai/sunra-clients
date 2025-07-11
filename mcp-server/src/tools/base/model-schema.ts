import { z } from 'zod';
import { MCPError } from '../../types/index.js';

const modelSchemaSchema = z.object({
  modelId: z.string().min(1).describe('The ID of the model to get the schema for'),
});

export const modelSchemaTool = {
  name: 'model-schema',
  description: 'Get the JSON schema for a specific AI model from its OpenAPI specification URL',
  parameters: modelSchemaSchema,
  execute: async (args: z.infer<typeof modelSchemaSchema>) => {
    try {
      // First, get all models to find the specific model with its OpenAPI URL
      const modelsResponse = await fetch('https://api.sunra.ai/v1/models?limit=9999', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!modelsResponse.ok) {
        throw new Error(`Failed to fetch models: HTTP ${modelsResponse.status}: ${modelsResponse.statusText}`);
      }

      const allModels = await modelsResponse.json();
      const models = Array.isArray(allModels) ? allModels : (allModels.models || []);

      // Find the specific model
      const model = models.find((m: any) => m.id === args.modelId);

      if (!model) {
        throw new MCPError('MODEL_NOT_FOUND', `Model with ID '${args.modelId}' not found`);
      }

      if (!model.openapi) {
        throw new MCPError('NO_OPENAPI_URL', `Model '${args.modelId}' does not have an OpenAPI specification URL`);
      }

      // Fetch the OpenAPI schema
      const schemaResponse = await fetch(model.openapi, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!schemaResponse.ok) {
        throw new Error(`Failed to fetch schema: HTTP ${schemaResponse.status}: ${schemaResponse.statusText}`);
      }

      const schema = await schemaResponse.json();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              modelId: args.modelId,
              modelName: model.name || model.id,
              schemaUrl: model.openapi,
              schema: schema,
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

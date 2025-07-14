import { z } from 'zod';
import { MCPError } from '../../types/index.js';

const modelSchemaSchema = z.object({
  modelSlug: z.string().min(1).describe('The model slug in format "owner/model/endpoint" to get the schema for'),
});

interface OpenAPISchema {
  paths?: {
    [path: string]: {
      post?: {
        requestBody?: {
          content?: {
            'application/json'?: {
              schema?: any;
            };
          };
        };
      };
      get?: {
        responses?: {
          '200'?: {
            content?: {
              'application/json'?: {
                schema?: any;
              };
            };
          };
        };
      };
    };
  };
  components?: {
    schemas?: {
      [schemaName: string]: any;
    };
  };
}

function parseModelSlug(modelSlug: string): { owner: string; model: string; endpoint: string } {
  const parts = modelSlug.split('/');
  if (parts.length !== 3) {
    throw new MCPError('INVALID_MODEL_SLUG', `Invalid model slug format. Expected "owner/model/endpoint", got "${modelSlug}"`);
  }

  return {
    owner: parts[0],
    model: parts[1],
    endpoint: parts[2]
  };
}

/**
 * Resolves $ref references in a schema object
 * @param schema - The schema object that may contain $ref references
 * @param document - The full OpenAPI document containing the components
 * @param visited - Set of visited references to prevent circular references
 * @returns The resolved schema with all references expanded
 */
function resolveReferences(schema: any, document: OpenAPISchema, visited: Set<string> = new Set()): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // Handle $ref
  if (schema.$ref && typeof schema.$ref === 'string') {
    if (visited.has(schema.$ref)) {
      // Circular reference detected, return a reference placeholder
      return { $ref: schema.$ref, $circular: true };
    }

    visited.add(schema.$ref);

    // Parse the reference path (e.g., "#/components/schemas/TextToVideoInput")
    const refPath = schema.$ref;
    if (refPath.startsWith('#/')) {
      const pathParts = refPath.substring(2).split('/');
      let referencedSchema: any = document;

      // Navigate through the path
      for (const part of pathParts) {
        if (referencedSchema && typeof referencedSchema === 'object' && part in referencedSchema) {
          referencedSchema = referencedSchema[part];
        } else {
          throw new MCPError('REFERENCE_NOT_FOUND', `Reference ${refPath} not found in OpenAPI document`);
        }
      }

      // Recursively resolve references in the referenced schema
      const resolved = resolveReferences(referencedSchema, document, new Set(visited));
      visited.delete(schema.$ref);
      return resolved;
    } else {
      throw new MCPError('UNSUPPORTED_REFERENCE', `Unsupported reference format: ${refPath}`);
    }
  }

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map(item => resolveReferences(item, document, visited));
  }

  // Handle objects
  const resolved: any = {};
  for (const [key, value] of Object.entries(schema)) {
    resolved[key] = resolveReferences(value, document, visited);
  }

  return resolved;
}

export const modelSchemaTool = {
  name: 'model-schema',
  description: 'Get the input and output JSON schemas for a specific AI model endpoint from its OpenAPI specification',
  parameters: modelSchemaSchema,
  execute: async (args: z.infer<typeof modelSchemaSchema>) => {
    try {
      const { owner, model, endpoint } = parseModelSlug(args.modelSlug);

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
      const models = Array.isArray(allModels) ? allModels : (allModels.data || []);

      // Find the specific model by matching owner and model name
      const foundModel = models.find((m: any) =>
        m.owner?.name === owner && m.name === model
      );

      if (!foundModel) {
        throw new MCPError('MODEL_NOT_FOUND', `Model with slug '${owner}/${model}' not found`);
      }

      // Find the specific endpoint
      const endpointData = foundModel.endpoints?.find((ep: any) => ep.name === endpoint);
      if (!endpointData) {
        throw new MCPError('ENDPOINT_NOT_FOUND', `Endpoint '${endpoint}' not found for model '${owner}/${model}'`);
      }

      if (!foundModel.openapi) {
        throw new MCPError('NO_OPENAPI_URL', `Model '${owner}/${model}' does not have an OpenAPI specification URL`);
      }

      // Fetch the OpenAPI schema
      const schemaResponse = await fetch(foundModel.openapi, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!schemaResponse.ok) {
        throw new Error(`Failed to fetch schema: HTTP ${schemaResponse.status}: ${schemaResponse.statusText}`);
      }

      const doc: OpenAPISchema = await schemaResponse.json();

      // Construct the path for the specific endpoint
      const realSlug = endpointData.path ?? `${owner}/${model}/${endpoint}`;
      const modelPath = `/${realSlug}`;

      // Extract input schema from POST request body
      const modelDoc = doc.paths?.[modelPath];
      const postRequest = modelDoc?.post;
      const requestData = postRequest?.requestBody;
      const inputSchemaRaw = requestData?.content?.['application/json']?.schema;

      // Extract output schema from GET request for request details
      const requestDetailDoc = doc.paths?.['/requests/{request_id}'];
      const getRequest = requestDetailDoc?.get;
      const responseData = getRequest?.responses?.['200'];
      const outputSchemaRaw = responseData?.content?.['application/json']?.schema;

      // Resolve references in both schemas
      let inputSchema = null;
      let outputSchema = null;

      try {
        if (inputSchemaRaw) {
          inputSchema = resolveReferences(inputSchemaRaw, doc);
        }
      } catch (error) {
        console.warn(`Failed to resolve input schema references: ${error instanceof Error ? error.message : 'Unknown error'}`);
        inputSchema = inputSchemaRaw; // Fallback to raw schema
      }

      try {
        if (outputSchemaRaw) {
          outputSchema = resolveReferences(outputSchemaRaw, doc);
        }
      } catch (error) {
        console.warn(`Failed to resolve output schema references: ${error instanceof Error ? error.message : 'Unknown error'}`);
        outputSchema = outputSchemaRaw; // Fallback to raw schema
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              modelSlug: args.modelSlug,
              owner,
              model,
              endpoint,
              inputSchema: inputSchema || null,
              outputSchema: outputSchema || null,
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

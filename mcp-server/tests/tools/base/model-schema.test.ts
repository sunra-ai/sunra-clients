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
      expect(modelSchemaTool.description).toBe('Get the input and output JSON schemas for a specific AI model endpoint from its OpenAPI specification');
    });

    it('should have parameters schema', () => {
      expect(modelSchemaTool.parameters).toBeDefined();
    });
  });

  describe('successful execution', () => {
    const mockModels = [
      {
        id: 'gpt-4',
        name: 'gpt-4',
        description: 'Advanced language model',
        provider: 'OpenAI',
        owner: { name: 'openai' },
        endpoints: [
          {
            name: 'text-completion',
            path: 'openai/gpt-4/text-completion'
          }
        ],
        openapi: 'https://api.openai.com/v1/models/gpt-4/openapi.json',
      },
      {
        id: 'dall-e-2',
        name: 'dall-e-2',
        description: 'AI image generation model',
        provider: 'OpenAI',
        owner: { name: 'openai' },
        endpoints: [
          {
            name: 'text-to-image',
            path: 'openai/dall-e-2/text-to-image'
          }
        ],
        openapi: 'https://api.openai.com/v1/models/dall-e-2/openapi.json',
      },
    ];

    const mockOpenAPIDoc = {
      paths: {
        '/openai/gpt-4/text-completion': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
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
                  }
                }
              }
            }
          }
        },
        '/requests/{request_id}': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          description: 'Request ID',
                        },
                        status: {
                          type: 'string',
                          description: 'Request status',
                        },
                        output: {
                          type: 'object',
                          description: 'Generated output',
                        },
                      },
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const mockOpenAPIDocWithReferences = {
      paths: {
        '/openai/gpt-4/text-completion': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TextCompletionInput'
                  }
                }
              }
            }
          }
        },
        '/requests/{request_id}': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/RequestResponse'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          TextCompletionInput: {
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
              settings: {
                $ref: '#/components/schemas/CompletionSettings'
              }
            },
            required: ['prompt'],
          },
          CompletionSettings: {
            type: 'object',
            properties: {
              temperature: {
                type: 'number',
                description: 'Sampling temperature',
              },
              top_p: {
                type: 'number',
                description: 'Top-p sampling',
              }
            }
          },
          RequestResponse: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Request ID',
              },
              status: {
                type: 'string',
                description: 'Request status',
              },
              output: {
                type: 'object',
                description: 'Generated output',
              },
            },
          }
        }
      }
    };

    it('should fetch schema for existing model endpoint', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModels),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOpenAPIDoc),
        });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

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
      expect(parsedResponse.modelSlug).toBe('openai/gpt-4/text-completion');
      expect(parsedResponse.owner).toBe('openai');
      expect(parsedResponse.model).toBe('gpt-4');
      expect(parsedResponse.endpoint).toBe('text-completion');
      expect(parsedResponse.inputSchema).toEqual(mockOpenAPIDoc.paths['/openai/gpt-4/text-completion'].post.requestBody.content['application/json'].schema);
      expect(parsedResponse.outputSchema).toEqual(mockOpenAPIDoc.paths['/requests/{request_id}'].get.responses['200'].content['application/json'].schema);
    });

    it('should resolve $ref references in schemas', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModels),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOpenAPIDocWithReferences),
        });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);

      // Verify that references have been resolved
      expect(parsedResponse.inputSchema).toEqual({
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
          settings: {
            type: 'object',
            properties: {
              temperature: {
                type: 'number',
                description: 'Sampling temperature',
              },
              top_p: {
                type: 'number',
                description: 'Top-p sampling',
              }
            }
          }
        },
        required: ['prompt'],
      });

      expect(parsedResponse.outputSchema).toEqual({
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Request ID',
          },
          status: {
            type: 'string',
            description: 'Request status',
          },
          output: {
            type: 'object',
            description: 'Generated output',
          },
        },
      });
    });

    it('should handle circular references', async () => {
      const mockOpenAPIDocWithCircularRef = {
        paths: {
          '/openai/gpt-4/text-completion': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CircularSchema'
                    }
                  }
                }
              }
            }
          },
          '/requests/{request_id}': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            CircularSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                children: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CircularSchema'
                  }
                }
              }
            }
          }
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModels),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOpenAPIDocWithCircularRef),
        });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);

      // Verify that circular reference is handled
      expect(parsedResponse.inputSchema.properties.children.items).toHaveProperty('$circular', true);
    });

    it('should handle models wrapped in response object', async () => {
      const mockResponse = {
        data: mockModels,
        total: mockModels.length,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAPIDoc),
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.modelSlug).toBe('openai/gpt-4/text-completion');
    });

    it('should handle missing input or output schemas', async () => {
      const incompleteOpenAPIDoc = {
        paths: {
          '/openai/gpt-4/text-completion': {
            post: {
              // Missing requestBody
            }
          },
          '/requests/{request_id}': {
            // Missing get method
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(incompleteOpenAPIDoc),
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.inputSchema).toBeNull();
      expect(parsedResponse.outputSchema).toBeNull();
    });
  });

  describe('error handling', () => {

    it('should handle invalid model slug format', async () => {
      const result = await modelSchemaTool.execute({ modelSlug: 'invalid-format' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Invalid model slug format. Expected "owner/model/endpoint", got "invalid-format"');
      expect(parsedResponse.code).toBe('INVALID_MODEL_SLUG');
    });

    it('should handle model not found', async () => {
      const mockModels = [
        {
          id: 'other-model',
          name: 'other-model',
          owner: { name: 'other' },
          endpoints: [{ name: 'endpoint' }],
          openapi: 'https://example.com/other.json'
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe("Model with slug 'openai/gpt-4' not found");
      expect(parsedResponse.code).toBe('MODEL_NOT_FOUND');
    });

    it('should handle endpoint not found', async () => {
      const mockModels = [
        {
          id: 'gpt-4',
          name: 'gpt-4',
          owner: { name: 'openai' },
          endpoints: [{ name: 'different-endpoint' }],
          openapi: 'https://api.openai.com/v1/models/gpt-4/openapi.json',
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe("Endpoint 'text-completion' not found for model 'openai/gpt-4'");
      expect(parsedResponse.code).toBe('ENDPOINT_NOT_FOUND');
    });

    it('should handle model without OpenAPI URL', async () => {
      const mockModels = [
        {
          id: 'gpt-4',
          name: 'gpt-4',
          owner: { name: 'openai' },
          endpoints: [{ name: 'text-completion' }],
          // No openapi field
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe("Model 'openai/gpt-4' does not have an OpenAPI specification URL");
      expect(parsedResponse.code).toBe('NO_OPENAPI_URL');
    });

    it('should handle HTTP error when fetching models', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Failed to fetch models: HTTP 401: Unauthorized');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle HTTP error when fetching schema', async () => {
      const mockModels = [
        {
          id: 'gpt-4',
          name: 'gpt-4',
          owner: { name: 'openai' },
          endpoints: [{ name: 'text-completion' }],
          openapi: 'https://api.openai.com/v1/models/gpt-4/openapi.json',
        },
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

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Failed to fetch schema: HTTP 404: Not Found');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle missing reference in schema', async () => {
      const mockModels = [
        {
          id: 'gpt-4',
          name: 'gpt-4',
          owner: { name: 'openai' },
          endpoints: [{ name: 'text-completion' }],
          openapi: 'https://api.openai.com/v1/models/gpt-4/openapi.json',
        },
      ];

      const mockOpenAPIDocWithMissingRef = {
        paths: {
          '/openai/gpt-4/text-completion': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/NonExistentSchema'
                    }
                  }
                }
              }
            }
          },
          '/requests/{request_id}': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: { id: { type: 'string' } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            // NonExistentSchema is missing
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAPIDocWithMissingRef),
      });

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(true);
      // Should fall back to raw schema when reference resolution fails
      expect(parsedResponse.inputSchema).toEqual({
        $ref: '#/components/schemas/NonExistentSchema'
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Network error');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle generic errors', async () => {
      mockFetch.mockRejectedValue('Generic error');

      const result = await modelSchemaTool.execute({ modelSlug: 'openai/gpt-4/text-completion' });

      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(true);

      const parsedResponse = JSON.parse(result.content[0].text);
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error).toBe('Unknown error occurred');
      expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
    });
  });
});

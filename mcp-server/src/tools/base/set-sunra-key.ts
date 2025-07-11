import { z } from 'zod';
import { setSunraApiKey, getCurrentApiKey } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const setSunraKeySchema = z.object({
  apiKey: z.string().min(1).describe('The Sunra API key to configure'),
});

export const setSunraKeyTool = {
  name: 'set-sunra-key',
  description: 'Set the Sunra API key for authenticating with the Sunra.ai service',
  parameters: setSunraKeySchema,
  execute: async (args: z.infer<typeof setSunraKeySchema>) => {
    try {
      setSunraApiKey(args.apiKey);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: 'Sunra API key configured successfully',
              keyPrefix: args.apiKey.substring(0, 8) + '...',
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

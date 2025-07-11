import { z } from 'zod';
import { getSunraClient } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const resultSchema = z.object({
  requestId: z.string().min(1).describe('The unique identifier for the request'),
});

export const resultTool = {
  name: 'result',
  description: 'Retrieve the result of a completed request from the Sunra queue',
  parameters: resultSchema,
  execute: async (args: z.infer<typeof resultSchema>) => {
    try {
      const client = getSunraClient();
      const result = await client.queue.result({
        requestId: args.requestId,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              requestId: result.requestId,
              data: result.data,
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

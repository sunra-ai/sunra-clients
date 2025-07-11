import { z } from 'zod';
import { getSunraClient } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const cancelSchema = z.object({
  requestId: z.string().min(1).describe('The unique identifier for the request to cancel'),
});

export const cancelTool = {
  name: 'cancel',
  description: 'Cancel a request in the Sunra queue',
  parameters: cancelSchema,
  execute: async (args: z.infer<typeof cancelSchema>) => {
    try {
      const client = getSunraClient();
      await client.queue.cancel({
        requestId: args.requestId,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              requestId: args.requestId,
              message: 'Request cancelled successfully',
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

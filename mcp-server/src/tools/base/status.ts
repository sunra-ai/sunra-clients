import { z } from 'zod';
import { getSunraClient } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const statusSchema = z.object({
  requestId: z.string().describe('The unique identifier for the request'),
  logs: z.boolean().optional().describe('Whether to include logs in the response (default: false)'),
});

export const statusTool = {
  name: 'status',
  description: 'Check the status of a request in the Sunra queue',
  parameters: statusSchema,
  execute: async (args: z.infer<typeof statusSchema>) => {
    try {
      const client = getSunraClient();
      const result = await client.queue.status({
        requestId: args.requestId,
        logs: args.logs ?? false,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              requestId: result.request_id,
              status: result.status,
              responseUrl: result.response_url,
              ...(result.status === 'IN_QUEUE' && { queuePosition: (result as any).queue_position }),
              ...((result as any).logs && { logs: (result as any).logs }),
              ...(result.status === 'COMPLETED' && (result as any).metrics && { metrics: (result as any).metrics }),
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

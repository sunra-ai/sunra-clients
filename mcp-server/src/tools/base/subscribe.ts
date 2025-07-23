import { z } from 'zod';
import { getSunraClient } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const subscribeSchema = z.object({
  endpointId: z.string().describe('The ID of the API endpoint to submit to'),
  input: z.any().optional().describe('The input data to send to the endpoint'),
  mode: z.enum(['polling', 'streaming']).optional().describe('The mode to use for subscribing (default: polling)'),
  pollInterval: z.number().optional().describe('The interval in milliseconds for polling (default: 1000)'),
  timeout: z.number().optional().describe('The timeout in milliseconds for the request'),
  logs: z.boolean().optional().describe('Whether to include logs in the response (default: false)'),
  webhookUrl: z.string().url().optional().describe('Optional webhook URL to receive completion notifications'),
});

export const subscribeTool = {
  name: 'subscribe',
  description: 'Submit a request to the Sunra queue and wait for completion',
  parameters: subscribeSchema,
  execute: async (args: z.infer<typeof subscribeSchema>) => {
    try {
      const client = getSunraClient();
      const result = await client.subscribe(args.endpointId, {
        input: args.input,
        mode: args.mode,
        pollInterval: args.pollInterval,
        timeout: args.timeout,
        logs: args.logs,
        webhookUrl: args.webhookUrl,
        onEnqueue: (requestId: string) => {
          console.log(`Request ${requestId} enqueued`);
        },
        onQueueUpdate: (status: any) => {
          console.log(`Queue update: ${status.status}`);
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              requestId: result?.requestId,
              data: result?.data,
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

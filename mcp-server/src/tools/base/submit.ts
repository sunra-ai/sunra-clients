import { z } from 'zod';
import { getSunraClient } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const submitSchema = z.object({
  endpointId: z.string().describe('The ID of the API endpoint to submit to'),
  input: z.any().optional().describe('The input data to send to the endpoint'),
  webhookUrl: z.string().url().optional().describe('Optional webhook URL to receive completion notifications'),
});

export const submitTool = {
  name: 'submit',
  description: 'Submit a request to the Sunra queue for processing',
  parameters: submitSchema,
  execute: async (args: z.infer<typeof submitSchema>) => {
    try {
      const client = getSunraClient();
      const result = await client.queue.submit(args.endpointId, {
        input: args.input,
        webhookUrl: args.webhookUrl,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              requestId: result.request_id,
              status: result.status,
              queuePosition: result.queue_position,
              responseUrl: result.response_url,
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

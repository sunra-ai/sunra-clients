import { z } from 'zod';
import { getSunraClient } from '../../utils/client.js';
import { MCPError } from '../../types/index.js';

const uploadSchema = z.object({
    file: z.string().min(1).describe('The file data as a base64 encoded string or blob URL'),
    contentType: z.string().optional().describe('The MIME type of the file (e.g., image/jpeg, application/pdf)'),
    fileName: z.string().optional().describe('The name of the file'),
});

export const uploadTool = {
    name: 'upload',
    description: 'Upload a file to Sunra storage and get back a URL',
    parameters: uploadSchema,
    execute: async (args: z.infer<typeof uploadSchema>) => {
        try {
            const client = getSunraClient();

            // Convert base64 string to Blob
            let blob: Blob;
            if (args.file.startsWith('data:')) {
                // Handle data URI
                const response = await fetch(args.file);
                blob = await response.blob();
            } else if (args.file.startsWith('blob:')) {
                // Handle blob URL
                const response = await fetch(args.file);
                blob = await response.blob();
            } else {
                // Handle base64 string
                const base64Data = args.file.replace(/^data:[^;]+;base64,/, '');
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: args.contentType || 'application/octet-stream' });
            }

            const uploadUrl = await client.storage.upload(blob);

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: JSON.stringify({
                            success: true,
                            url: uploadUrl,
                            fileName: args.fileName,
                            contentType: args.contentType || blob.type,
                            size: blob.size,
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

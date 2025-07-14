import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadTool } from '../../../src/tools/base/upload';
import { getSunraClient } from '../../../src/utils/client';
import { MCPError } from '../../../src/types';

vi.mock('../../../src/utils/client');

describe('uploadTool', () => {
    const mockSunraClient = {
        storage: {
            upload: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getSunraClient).mockReturnValue(mockSunraClient as any);
    });

    describe('tool definition', () => {
        it('should have correct name', () => {
            expect(uploadTool.name).toBe('upload');
        });

        it('should have description', () => {
            expect(uploadTool.description).toBe('Upload a file to Sunra storage and get back a URL');
        });

        it('should have parameters schema', () => {
            expect(uploadTool.parameters).toBeDefined();
        });
    });

    describe('parameter validation', () => {
        it('should accept optional contentType', async () => {
            mockSunraClient.storage.upload.mockResolvedValue('https://example.com/file.jpg');

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
                contentType: 'image/jpeg',
            });

            expect(result.content[0].text).toContain('success');
        });

        it('should accept optional fileName', async () => {
            mockSunraClient.storage.upload.mockResolvedValue('https://example.com/file.jpg');

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
                fileName: 'test.jpg',
            });

            expect(result.content[0].text).toContain('test.jpg');
        });
    });

    describe('successful execution', () => {
        it('should handle data URI files', async () => {
            const mockUrl = 'https://example.com/uploaded-file.jpg';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
                contentType: 'image/jpeg',
                fileName: 'test.jpg',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.url).toBe(mockUrl);
            expect(parsedResponse.fileName).toBe('test.jpg');
            expect(parsedResponse.contentType).toBe('image/jpeg');
        });

        it('should handle blob URLs', async () => {
            const mockUrl = 'https://example.com/uploaded-file.jpg';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            // Mock fetch for blob URL
            global.fetch = vi.fn().mockResolvedValue({
                blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
            });

            const result = await uploadTool.execute({
                file: 'blob:https://example.com/test-blob',
                contentType: 'image/jpeg',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.url).toBe(mockUrl);
        });

        it('should handle base64 strings without data URI prefix', async () => {
            const mockUrl = 'https://example.com/uploaded-file.txt';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            // Mock atob
            global.atob = vi.fn().mockReturnValue('test');

            const result = await uploadTool.execute({
                file: 'dGVzdA==', // base64 for "test"
                contentType: 'text/plain',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.url).toBe(mockUrl);
        });

        it('should use default content type when not provided', async () => {
            const mockUrl = 'https://example.com/uploaded-file.bin';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            global.atob = vi.fn().mockReturnValue('test');

            const result = await uploadTool.execute({
                file: 'dGVzdA==',
            });

            expect(result.content).toHaveLength(1);
            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.contentType).toBe('application/octet-stream');
        });

        it('should include file size in response', async () => {
            const mockUrl = 'https://example.com/uploaded-file.txt';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            global.atob = vi.fn().mockReturnValue('test');

            const result = await uploadTool.execute({
                file: 'dGVzdA==',
                contentType: 'text/plain',
            });

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.size).toBeDefined();
            expect(typeof parsedResponse.size).toBe('number');
        });
    });

    describe('error handling', () => {
        it('should handle client not configured', async () => {
            vi.mocked(getSunraClient).mockImplementation(() => {
                throw new MCPError('NO_API_KEY', 'API key not configured');
            });

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');
            expect(result.isError).toBe(true);

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(false);
            expect(parsedResponse.error).toBe('API key not configured');
            expect(parsedResponse.code).toBe('NO_API_KEY');
        });

        it('should handle upload failure', async () => {
            mockSunraClient.storage.upload.mockRejectedValue(new Error('Upload failed'));

            // Mock fetch to avoid undefined property errors
            global.fetch = vi.fn().mockResolvedValue({
                blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
            });

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');
            expect(result.isError).toBe(true);

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(false);
            expect(parsedResponse.error).toBe('Upload failed');
            expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
        });

        it('should handle MCPError correctly', async () => {
            mockSunraClient.storage.upload.mockRejectedValue(
                new MCPError('UPLOAD_FAILED', 'File upload failed', { maxSize: '10MB' })
            );

            // Mock fetch to avoid undefined property errors
            global.fetch = vi.fn().mockResolvedValue({
                blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
            });

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');
            expect(result.isError).toBe(true);

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(false);
            expect(parsedResponse.error).toBe('File upload failed');
            expect(parsedResponse.code).toBe('UPLOAD_FAILED');
        });

        it('should handle unknown error types', async () => {
            mockSunraClient.storage.upload.mockRejectedValue('Unknown error');

            // Mock fetch to avoid undefined property errors
            global.fetch = vi.fn().mockResolvedValue({
                blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
            });

            const result = await uploadTool.execute({
                file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==',
            });

            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');
            expect(result.isError).toBe(true);

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(false);
            expect(parsedResponse.error).toBe('Unknown error occurred');
            expect(parsedResponse.code).toBe('UNKNOWN_ERROR');
        });

        it('should handle fetch errors for blob URLs', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

            const result = await uploadTool.execute({
                file: 'blob:https://example.com/test-blob',
            });

            expect(result.content).toHaveLength(1);
            expect(result.isError).toBe(true);

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(false);
            expect(parsedResponse.error).toBe('Fetch failed');
        });

        it('should handle invalid base64 data', async () => {
            global.atob = vi.fn().mockImplementation(() => {
                throw new Error('Invalid base64');
            });

            const result = await uploadTool.execute({
                file: 'invalid-base64',
            });

            expect(result.content).toHaveLength(1);
            expect(result.isError).toBe(true);

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(false);
            expect(parsedResponse.error).toBe('Invalid base64');
        });
    });

    describe('edge cases', () => {
        it('should handle empty file data', async () => {
            const mockUrl = 'https://example.com/empty-file';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            global.atob = vi.fn().mockReturnValue('');

            const result = await uploadTool.execute({
                file: 'empty',
                contentType: 'text/plain',
            });

            expect(result.content).toHaveLength(1);
            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.size).toBe(0);
        });

        it('should handle very long file names', async () => {
            const mockUrl = 'https://example.com/uploaded-file.txt';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            global.atob = vi.fn().mockReturnValue('test');

            const longFileName = 'a'.repeat(1000) + '.txt';
            const result = await uploadTool.execute({
                file: 'dGVzdA==',
                fileName: longFileName,
            });

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.fileName).toBe(longFileName);
        });

        it('should handle special characters in content type', async () => {
            const mockUrl = 'https://example.com/uploaded-file';
            mockSunraClient.storage.upload.mockResolvedValue(mockUrl);

            global.atob = vi.fn().mockReturnValue('test');

            const result = await uploadTool.execute({
                file: 'dGVzdA==',
                contentType: 'application/vnd.api+json; charset=utf-8',
            });

            const parsedResponse = JSON.parse(result.content[0].text);
            expect(parsedResponse.success).toBe(true);
            expect(parsedResponse.contentType).toBe('application/vnd.api+json; charset=utf-8');
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastMCP } from 'fastmcp';

// Mock FastMCP
vi.mock('fastmcp');

// Mock all the tool modules
vi.mock('../../src/tools/base/submit', () => ({
  submitTool: {
    name: 'submit',
    description: 'Submit a request to the Sunra queue for processing',
    parameters: {},
    execute: vi.fn(),
  },
}));

vi.mock('../../src/tools/base/status', () => ({
  statusTool: {
    name: 'status',
    description: 'Check the status of a request in the Sunra queue',
    parameters: {},
    execute: vi.fn(),
  },
}));

vi.mock('../../src/tools/base/result', () => ({
  resultTool: {
    name: 'result',
    description: 'Retrieve the result of a completed request from the Sunra queue',
    parameters: {},
    execute: vi.fn(),
  },
}));

vi.mock('../../src/tools/base/cancel', () => ({
  cancelTool: {
    name: 'cancel',
    description: 'Cancel a request in the Sunra queue',
    parameters: {},
    execute: vi.fn(),
  },
}));

vi.mock('../../src/tools/base/subscribe', () => ({
  subscribeTool: {
    name: 'subscribe',
    description: 'Submit a request to the Sunra queue and wait for completion',
    parameters: {},
    execute: vi.fn(),
  },
}));

vi.mock('../../src/tools/base/set-sunra-key', () => ({
  setSunraKeyTool: {
    name: 'set-sunra-key',
    description: 'Set the Sunra API key for authenticating with the Sunra.ai service',
    parameters: {},
    execute: vi.fn(),
  },
}));

describe('Server Integration', () => {
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock server instance
    mockServer = {
      addTool: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    // Mock FastMCP constructor
    vi.mocked(FastMCP).mockImplementation(() => mockServer);
  });

  describe('Server Configuration', () => {
    it('should create FastMCP server with correct configuration', async () => {
      // Import the server module to trigger initialization
      await import('../../src/index');

      expect(FastMCP).toHaveBeenCalledWith({
        name: 'sunra-mcp-server',
        version: '1.0.0',
      });
    });
  });

  describe('Tool Registration', () => {
    it('should register tools with correct structure', async () => {
      // Import the server module to trigger initialization
      await import('../../src/index');

      const toolCalls = mockServer.addTool.mock.calls;

      toolCalls.forEach((call: any) => {
        const tool = call[0];
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('execute');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.execute).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle FastMCP constructor errors', async () => {
      const error = new Error('FastMCP initialization failed');
      vi.mocked(FastMCP).mockImplementation(() => {
        throw error;
      });

      // Should not throw when importing
      await expect(import('../../src/index')).resolves.toBeDefined();
    });

    it('should handle server start errors', async () => {
      mockServer.start.mockRejectedValue(new Error('Server start failed'));

      // Should not throw when importing
      await expect(import('../../src/index')).resolves.toBeDefined();
    });

    it('should handle tool registration errors', async () => {
      mockServer.addTool.mockImplementation(() => {
        throw new Error('Tool registration failed');
      });

      // Should not throw when importing
      await expect(import('../../src/index')).resolves.toBeDefined();
    });
  });

  describe('Tool Validation', () => {
    it('should ensure all tools have unique names', async () => {
      await import('../../src/index');

      const toolCalls = mockServer.addTool.mock.calls;
      const toolNames = toolCalls.map((call: any) => call[0].name);
      const uniqueNames = new Set(toolNames);

      expect(uniqueNames.size).toBe(toolNames.length);
    });

    it('should ensure all tools have descriptions', async () => {
      await import('../../src/index');

      const toolCalls = mockServer.addTool.mock.calls;

      toolCalls.forEach((call: any) => {
        const tool = call[0];
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it('should ensure all tools have execute functions', async () => {
      await import('../../src/index');

      const toolCalls = mockServer.addTool.mock.calls;

      toolCalls.forEach((call: any) => {
        const tool = call[0];
        expect(typeof tool.execute).toBe('function');
      });
    });
  });
});

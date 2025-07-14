import { vi, beforeEach, afterEach } from 'vitest';

// Mock the Sunra client module
vi.mock('@sunra/client', () => ({
  createSunraClient: vi.fn(() => ({
    queue: {
      submit: vi.fn(),
      status: vi.fn(),
      result: vi.fn(),
      cancel: vi.fn(),
      subscribeToStatus: vi.fn(),
    },
    subscribe: vi.fn(),
    config: vi.fn(),
  })),
  SunraClient: vi.fn(),
}));

// Mock FastMCP
vi.mock('fastmcp', () => ({
  FastMCP: vi.fn(() => ({
    addTool: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

// Setup environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities
global.createMockSunraClient = () => ({
  queue: {
    submit: vi.fn(),
    status: vi.fn(),
    result: vi.fn(),
    cancel: vi.fn(),
    subscribeToStatus: vi.fn(),
  },
  subscribe: vi.fn(),
  config: vi.fn(),
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
  // Clear environment variables
  delete process.env.SUNRA_KEY;
});

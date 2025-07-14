export interface SunraServerConfig {
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface MCPToolResponse<T = any> {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: T;
  }>;
  isError?: boolean;
}

export class MCPError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any> | null
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

---
description:
globs:
alwaysApply: false
---

# MCP Server Development Rules

## Overview
This file contains rules and guidelines for developing MCP (Model Context Protocol) servers using fast-mcp and TypeScript, specifically for integrating with Sunra.ai services.

## Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: FastMCP (fast-mcp library)
- **Language**: TypeScript with strict type checking
- **Package Manager**: npm or pnpm
- **API Client**: @sunra/client for Sunra.ai integration

## Project Structure Standards

### Directory Layout
```
mcp-server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── tools/             # MCP tools implementation
│   │   └── base.ts        # base functions such as submit, status, result, cancel
│   │   └── models
│   │     └── provider1    # group tools by provider name
│   │       └── model1.ts  # add each endpoint as a standalone tool in [model name].ts
│   │       └── model2.ts
│   │     └── provider2
│   ├── resources/         # MCP resources (if needed)
│   ├── prompts/           # MCP prompts (if needed)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
├── README.md
└── .env.example
```

### File Naming Conventions
- Use kebab-case for file names: `text-to-image.ts`
- Use PascalCase for class names: `TextToImageTool`
- Use camelCase for function and variable names: `generateImage`
- Use UPPER_SNAKE_CASE for constants: `DEFAULT_TIMEOUT`

## Code Standards

### TypeScript Configuration
- Enable strict mode: `"strict": true`
- Use ES2020 or later target
- Enable experimental decorators if needed
- Include proper type definitions for all dependencies
- Use 2 space indent size

### Error Handling
- Always wrap async operations in try-catch blocks
- Use specific error types for different failure modes
- Provide meaningful error messages to users
- Log errors appropriately for debugging

### Documentation
- Use JSDoc comments for all public functions and classes
- Document parameter types and return values
- Include usage examples in documentation
- Explain complex business logic with inline comments

## MCP Server Implementation Guidelines

### Server Setup
- Use FastMCP's `FastMCPServer` class for server creation
- Configure both stdio and HTTP transport options
- Set up proper error handling middleware
- Include health check endpoints for HTTP mode

### Tool Implementation
- Each tool should have a single, well-defined responsibility
- Use Zod schemas for input validation
- Implement proper error handling and user feedback
- Support both synchronous and asynchronous operations where appropriate

### Tool Categories for Sunra.ai Integration
1. **Base Tools**
   - `submit`: Submit a request
   - `status`: Query the status of a request
   - `result`: Get the result of a request
   - `cancel`: Cancel a request
   - `subscribe`: Submit and wait for status to be determined(COMPLETED, FAILED or CANCELED).

2. **Model Endpoint Tools**
   - `[provider]/[model]/[endpoint]`: A specific model endpoint, such as `black-forest-labs/flux-kontext-max/text-to-image`


### Input Validation
- Use Zod schemas for all tool inputs
- Validate file uploads and URLs
- Implement reasonable limits on input sizes
- Provide clear error messages for invalid inputs

### Authentication
- Support API key authentication via environment variables
- Implement secure credential handling
- Allow configuration override through MCP server config

## API Integration Best Practices

### Sunra.ai Client Usage
- Use the official `@sunra/client` package
- Implement proper error handling for API failures
- Support both polling and streaming modes for queue operations
- Handle rate limiting and retry logic appropriately

### Response Handling
- Always return structured data with proper typing
- Include metadata like request IDs and processing times
- Provide progress updates for long-running operations
- Handle partial failures gracefully

### Resource Management
- Implement proper cleanup for temporary files
- Use streaming for large file operations
- Implement timeouts for long-running requests
- Clean up resources on server shutdown

## Configuration Management

### Environment Variables
- `SUNRA_KEY`: Required API key for Sunra.ai
- `MCP_SERVER_PORT`: Port for HTTP mode (default: 3000)
- `MCP_LOG_LEVEL`: Logging level (debug, info, warn, error)
- `MCP_TIMEOUT`: Default timeout for operations (default: 300000ms)

### Configuration Files
- Support `.env` files for local development
- Allow configuration through MCP server config
- Implement configuration validation on startup

## Testing Standards

### Unit Testing
- Write tests for all utility functions
- Mock external API calls appropriately
- Test error conditions and edge cases
- Use Vitest testing framework

### Integration Testing
- Test MCP tool implementations end-to-end
- Verify proper error handling with external APIs
- Test configuration and environment setup
- Include performance benchmarks for critical operations

## Security Considerations

### API Key Handling
- Never log or expose API keys in code
- Use environment variables for sensitive configuration
- Implement proper error messages that don't leak credentials
- Support key rotation without server restart

### Input Sanitization
- Validate all user inputs before processing
- Sanitize file paths and URLs
- Implement upload size limits
- Check file types and content validation

### Rate Limiting
- Implement client-side rate limiting
- Handle API rate limit responses gracefully
- Provide user feedback on rate limit status
- Queue requests when limits are exceeded

## Performance Optimization

### Caching Strategy
- Cache frequently accessed resources
- Implement TTL for cached items
- Use appropriate cache keys and invalidation
- Consider memory usage for large cached items

### Concurrent Processing
- Use appropriate concurrency limits
- Implement queuing for high-volume operations
- Handle backpressure appropriately
- Monitor resource usage under load

## Deployment Guidelines

### Package Management
- Use exact versions for critical dependencies
- Include proper build scripts in package.json
- Implement health checks for deployed servers
- Support both development and production modes

### Docker Support
- Provide Dockerfile for containerized deployment
- Use multi-stage builds for optimized images
- Include proper environment variable handling
- Support orchestration with docker-compose

## Monitoring and Logging

### Logging Standards
- Use structured logging with appropriate levels
- Include request IDs for tracing
- Log performance metrics for operations
- Implement log rotation and retention policies

### Health Monitoring
- Implement health check endpoints
- Monitor API response times and error rates
- Track resource usage (memory, CPU, storage)
- Set up alerts for critical failures

## Development Workflow

### Code Organization
- Group related functionality in modules
- Use barrel exports for clean imports
- Implement proper separation of concerns
- Follow single responsibility principle

### Version Control
- Use semantic versioning for releases
- Write clear commit messages
- Include migration guides for breaking changes
- Tag releases appropriately

### Documentation Updates
- Update README with new features
- Maintain changelog for user-facing changes
- Document configuration options
- Provide troubleshooting guides

## Common Patterns

### Error Response Format
```typescript
interface MCPError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

### Tool Response Format
```typescript
interface ToolResponse<T = any> {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: T;
  }>;
  isError?: boolean;
}
```

### Configuration Schema
```typescript
interface ServerConfig {
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

## Performance Targets

### Response Times
- Tool execution: < 5 seconds for most operations
- Queue status checks: < 1 second
- Health checks: < 100ms
- Server startup: < 10 seconds

### Resource Usage
- Memory usage: < 512MB for basic operations
- CPU usage: < 50% during normal operation
- Disk usage: Minimal, with proper cleanup
- Network: Efficient use of API calls

## Troubleshooting Guidelines

### Common Issues
1. **API Key Problems**: Verify environment variables and permissions
2. **Timeout Issues**: Check network connectivity and increase timeout values
3. **Memory Issues**: Monitor for memory leaks in long-running operations
4. **Rate Limiting**: Implement exponential backoff and user feedback

### Debug Information
- Include request/response debugging when log level is debug
- Provide clear error messages with actionable steps
- Include relevant context in error reports
- Implement graceful degradation when possible

## Future Considerations

### Extensibility
- Design for easy addition of new AI models
- Support plugin architecture for custom tools
- Implement configuration-driven tool registration
- Plan for multi-tenant usage patterns

### Scalability
- Design for horizontal scaling
- Implement proper connection pooling
- Consider caching strategies for high-volume usage
- Plan for load balancing and failover scenarios

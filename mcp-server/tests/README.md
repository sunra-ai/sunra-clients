# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the Sunra MCP Server.

## Test Structure

### Configuration Files
- `setup.ts` - Global test setup, mocks, and utilities
- `../vitest.config.ts` - Vitest configuration with coverage settings

### Test Categories

#### 1. Unit Tests - Utils (`tests/utils/`)
- **`client.test.ts`** - Tests for client utility functions
  - Client initialization and configuration
  - API key management
  - Environment variable handling
  - Error handling for unconfigured clients

#### 2. Unit Tests - Tools (`tests/tools/base/`)
- **`submit.test.ts`** - Tests for the submit tool
  - Parameter validation (endpointId, input, webhookUrl)
  - Successful request submission
  - Error handling (API key missing, network errors)
  - Different input types and edge cases

- **`status.test.ts`** - Tests for the status tool
  - Parameter validation (requestId, logs)
  - Status checking for different request states (IN_QUEUE, IN_PROGRESS, COMPLETED)
  - Logs and metrics inclusion
  - Error handling

- **`result.test.ts`** - Tests for the result tool
  - Parameter validation (requestId)
  - Result retrieval for different data types
  - Complex nested result structures
  - Error handling for incomplete requests

- **`cancel.test.ts`** - Tests for the cancel tool
  - Parameter validation (requestId)
  - Successful request cancellation
  - Error handling (request not found, already completed)
  - Different request ID formats

- **`subscribe.test.ts`** - Tests for the subscribe tool
  - Parameter validation (all subscription parameters)
  - Successful subscription with various options
  - Callback handling (onEnqueue, onQueueUpdate)
  - Different subscription modes (polling, streaming)
  - Error handling

- **`set-sunra-key.test.ts`** - Tests for the set-sunra-key tool
  - Parameter validation (apiKey)
  - Successful API key configuration
  - Different API key formats
  - Security (key prefix masking)
  - Error handling

#### 3. Unit Tests - Types (`tests/types/`)
- **`index.test.ts`** - Tests for custom types
  - MCPError class functionality
  - Error creation with code, message, and details
  - Complex error details objects
  - Error inheritance and throwability

#### 4. Integration Tests (`tests/integration/`)
- **`server.test.ts`** - Integration tests for the main server
  - Server configuration and initialization
  - Tool registration and validation
  - Server lifecycle management
  - Error handling during startup
  - Tool structure validation

## Test Coverage

### Tools Coverage
- ✅ **submit** - Complete parameter validation, execution, and error handling
- ✅ **status** - All request states, logs, metrics, and error scenarios
- ✅ **result** - Different data types, complex structures, and error handling
- ✅ **cancel** - Request cancellation, different ID formats, and error handling
- ✅ **subscribe** - Full subscription flow, callbacks, and error handling
- ✅ **set-sunra-key** - API key configuration, security, and error handling

### Utilities Coverage
- ✅ **Client Management** - Initialization, configuration, and environment handling
- ✅ **Error Handling** - Custom error types and error propagation
- ✅ **Type Safety** - Parameter validation and type checking

### Integration Coverage
- ✅ **Server Setup** - FastMCP server configuration and tool registration
- ✅ **Tool Registration** - Correct tool structure and registration order
- ✅ **Error Handling** - Graceful error handling during server initialization

## Key Testing Patterns

### 1. Parameter Validation
All tools test both valid and invalid parameter combinations:
```typescript
it('should validate required parameters', () => {
  const result = tool.parameters.safeParse({});
  expect(result.success).toBe(false);
});

it('should accept valid parameters', () => {
  const result = tool.parameters.safeParse(validParams);
  expect(result.success).toBe(true);
});
```

### 2. Error Handling
Comprehensive error handling testing:
```typescript
it('should handle MCPError appropriately', async () => {
  const mcpError = new MCPError('CODE', 'message');
  mockFunction.mockRejectedValue(mcpError);
  
  const result = await tool.execute(args);
  
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('CODE');
});
```

### 3. Mock Management
Proper mock setup and cleanup:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
```

### 4. Security Testing
API key security validation:
```typescript
it('should not expose full API key in responses', async () => {
  const sensitiveKey = 'secret-key';
  const result = await tool.execute({ apiKey: sensitiveKey });
  
  expect(result.content[0].text).not.toContain(sensitiveKey);
});
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Run Once
```bash
pnpm test:run
```

### With Coverage
```bash
pnpm test:coverage
```

### Watch Mode
```bash
pnpm test:watch
```

## Test Configuration

### Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Test Environment
- **Runtime**: Node.js
- **Framework**: Vitest
- **Globals**: Enabled for describe/it/expect
- **Mocking**: Vi mocks for external dependencies

## Mock Strategy

### External Dependencies
- **@sunra/client**: Mocked to return controllable responses
- **fastmcp**: Mocked to track server configuration and tool registration
- **Console methods**: Mocked to avoid test output noise

### Module State Management
- Tests use `vi.resetModules()` to ensure clean state
- Environment variables are cleared between tests
- Mock implementations are reset with `vi.clearAllMocks()`

## Best Practices

1. **Test Structure**: Each test file follows the same pattern (tool configuration, parameter validation, execute function)
2. **Error Coverage**: Every tool tests both success and error scenarios
3. **Edge Cases**: Tests include boundary conditions and unusual inputs
4. **Isolation**: Tests are isolated and don't depend on execution order
5. **Mocking**: External dependencies are properly mocked
6. **Documentation**: Test descriptions clearly explain what is being tested

This test suite provides comprehensive coverage of the MCP server functionality, ensuring reliability and maintainability of the codebase. 

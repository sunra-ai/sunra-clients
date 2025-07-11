import { describe, it, expect } from 'vitest';
import { MCPError } from '../../src/types/index';

describe('MCPError', () => {
  it('should create an error with code and message', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('MCPError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test error message');
  });

  it('should create an error with code, message, and details', () => {
    const details = { additionalInfo: 'some details' };
    const error = new MCPError('TEST_ERROR', 'Test error message', details);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('MCPError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test error message');
    expect(error.details).toEqual(details);
  });

  it('should create an error without details', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message');

    expect(error.details).toBeUndefined();
  });

  it('should be throwable and catchable', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message');

    expect(() => {
      throw error;
    }).toThrow(MCPError);

    expect(() => {
      throw error;
    }).toThrow('Test error message');
  });

  it('should preserve stack trace', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('MCPError');
  });

  it('should handle complex details object', () => {
    const complexDetails = {
      requestId: 'req-123',
      timestamp: new Date().toISOString(),
      metadata: {
        userId: 'user-456',
        action: 'submit',
        parameters: {
          endpointId: 'test-endpoint',
          input: { prompt: 'test' },
        },
      },
      nested: {
        deeply: {
          nested: {
            value: 'test',
          },
        },
      },
    };

    const error = new MCPError('COMPLEX_ERROR', 'Complex error message', complexDetails);

    expect(error.details).toEqual(complexDetails);
    expect(error.details?.requestId).toBe('req-123');
    expect(error.details?.metadata?.userId).toBe('user-456');
    expect(error.details?.nested?.deeply?.nested?.value).toBe('test');
  });

  it('should handle null details', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message', null);

    expect(error.details).toBeNull();
  });

  it('should handle undefined details', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message', undefined);

    expect(error.details).toBeUndefined();
  });

  it('should handle empty details object', () => {
    const error = new MCPError('TEST_ERROR', 'Test error message', {});

    expect(error.details).toEqual({});
  });
});

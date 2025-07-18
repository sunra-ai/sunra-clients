# Error Handling Standardization Plan for Sunra SDKs

## Overview

This plan addresses the current inconsistencies in error handling across the JavaScript/TypeScript, Python, and Java SDKs for sunra.ai. The goal is to provide a unified, developer-friendly error handling experience that eliminates the need for users to manually destructure complex response objects.

## Current State Analysis

### JavaScript/TypeScript SDK
- **Issues**: Users must manually destructure `(error as any).response?.data ?? error` to extract error details
- **Inconsistency**: Error structure varies depending on whether it's an axios error or internal error
- **Documentation**: Complex and hard to document due to varying structures

### Python SDK
- **Status**: Most mature error handling with `SunraClientError` class
- **Features**: Already has `code`, `message`, `details`, `timestamp` properties
- **Implementation**: `_raise_for_status` function extracts error details from HTTP responses

### Java SDK
- **Status**: Good error handling with `SunraException` class
- **Features**: Has `code`, `message`, `details`, `timestamp`, `requestId` properties
- **Implementation**: `responseToException` method in `HttpClient.java` handles error extraction

## Goals

1. **Consistent Error Structure**: All SDKs should provide errors with a consistent structure matching the actual API response:
   ```json
   {
     "error": {
       "type": "business_logic_error",
       "code": "INSUFFICIENT_CREDIT",
       "message": "Insufficient credit for freeze_credit: required 0.025, available 0",
       "details": {
         "required": "0.025",
         "available": "0",
         "customerId": "org_PeU4GCrhht7SMHFfw6",
         "operation": "freeze_credit",
         "param": "amount"
       }
     },
     "timestamp": "2025-07-18T01:59:32.508Z",
     "request_id": "c4fb94f5-565e-45f4-8565-b39cc82af5ca",
     "rate_limit": {
       "limit": 100,
       "remaining": 99,
       "reset": 60
     }
   }
   ```

2. **Automatic Error Extraction**: Extract business errors from HTTP responses automatically, including:
   - Error details from nested `error` object  
   - Request ID from `x-request-id` header
   - Rate limit info from `x-ratelimit-*` headers
   - Timestamp from response body

3. **Network Error Normalization**: For non-business errors, create normalized network errors with HTTP status codes

4. **Optional Error Callbacks**: Add `onError` callback option to handle errors without throwing exceptions

5. **Cross-SDK Consistency**: All three SDKs should behave similarly for error scenarios

## Updated Error Usage Examples

### Business Logic Error (Insufficient Credits)
```javascript
// JavaScript
try {
  const result = await sunra.subscribe('model-endpoint', options)
} catch (error) {
  console.log(error.type)        // "business_logic_error"
  console.log(error.code)        // "INSUFFICIENT_CREDIT"
  console.log(error.message)     // "Insufficient credit for freeze_credit: required 0.025, available 0"
  console.log(error.details)     // { required: "0.025", available: "0", customerId: "org_...", ... }
  console.log(error.requestId)   // "c4fb94f5-565e-45f4-8565-b39cc82af5ca"
  console.log(error.rateLimit)   // { limit: 100, remaining: 99, reset: 60 }
  console.log(error.timestamp)   // "2025-07-18T01:59:32.508Z"
}
```

### Network Error (404, Invalid Endpoint)
```python
# Python
try:
    result = sunra_client.subscribe('invalid-endpoint', arguments={})
except sunra_client.SunraClientError as e:
    print(e.type)        # "network_error"  
    print(e.code)        # "HTTP_404"
    print(e.message)     # "HTTP 404: Not Found"
    print(e.details)     # {"status_code": 404, "response_text": "..."}
    print(e.request_id)  # "abc123..."
    print(e.rate_limit)  # {"limit": 100, "remaining": 99, "reset": 60}
```

### Using onError Callback (No Exceptions)
```java
// Java
var options = SubscribeOptions.<JsonObject>builder()
    .input(input)
    .resultType(JsonObject.class)
    .onError(error -> {
        System.out.println("Code: " + error.getCode());
        System.out.println("Type: " + error.getType()); 
        System.out.println("Message: " + error.getMessage());
        System.out.println("Rate Limit: " + error.getRateLimit());
        // Handle error without throwing
    })
    .build();

var result = sunra.subscribe(endpointId, options); // null if error occurred
```

## Implementation Plan

### Phase 1: JavaScript/TypeScript SDK Enhancements

#### 1.1 Create Error Classes
```typescript
// src/errors.ts
export interface SunraErrorDetails {
  [key: string]: any
}

export interface SunraRateLimit {
  limit: number
  remaining: number
  reset: number
}

export class SunraError extends Error {
  public readonly type?: string
  public readonly code: string
  public readonly details?: SunraErrorDetails
  public readonly timestamp?: string
  public readonly requestId?: string
  public readonly rateLimit?: SunraRateLimit

  constructor(options: {
    message: string
    type?: string
    code: string
    details?: SunraErrorDetails
    timestamp?: string
    requestId?: string
    rateLimit?: SunraRateLimit
  }) {
    super(options.message)
    this.name = 'SunraError'
    this.type = options.type
    this.code = options.code
    this.details = options.details
    this.timestamp = options.timestamp
    this.requestId = options.requestId
    this.rateLimit = options.rateLimit
  }

  toJSON() {
    const result: any = {
      error: {
        ...(this.type && { type: this.type }),
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    }
    
    if (this.timestamp) result.timestamp = this.timestamp
    if (this.requestId) result.request_id = this.requestId
    if (this.rateLimit) result.rate_limit = this.rateLimit
    
    return result
  }
}

export class SunraNetworkError extends SunraError {
  public readonly statusCode: number
  public readonly responseBody: string

  constructor(statusCode: number, responseBody: string, requestId?: string, rateLimit?: SunraRateLimit) {
    super({
      message: `HTTP ${statusCode}: ${responseBody || 'Request failed'}`,
      type: 'network_error',
      code: `HTTP_${statusCode}`,
      details: { statusCode, responseBody },
      requestId,
      rateLimit
    })
    this.statusCode = statusCode
    this.responseBody = responseBody
  }
}
```

#### 1.2 Error Extraction Utility
```typescript
// src/utils/error-handler.ts
import { AxiosError } from 'axios'
import { SunraError, SunraNetworkError, SunraRateLimit } from '../errors'

function extractRateLimitFromHeaders(headers: any): SunraRateLimit | undefined {
  const limit = headers?.['x-ratelimit-limit']
  const remaining = headers?.['x-ratelimit-remaining']
  const reset = headers?.['x-ratelimit-reset']
  
  if (limit !== undefined && remaining !== undefined && reset !== undefined) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10)
    }
  }
  
  return undefined
}

export function extractSunraError(error: any): SunraError {
  // Handle axios errors
  if (error.isAxiosError || error.response) {
    const response = error.response
    const requestId = response?.headers?.['x-request-id']
    const rateLimit = extractRateLimitFromHeaders(response?.headers)
    
    if (response?.data) {
      // Try to extract business error
      const data = response.data
      
      if (data.error && typeof data.error === 'object') {
        return new SunraError({
          message: data.error.message || 'Request failed',
          type: data.error.type,
          code: data.error.code || `HTTP_${response.status}`,
          details: data.error.details,
          timestamp: data.timestamp,
          requestId: requestId,
          rateLimit: rateLimit
        })
      }
      
      // Fallback to top-level fields for legacy responses
      if (data.message || data.detail) {
        return new SunraError({
          message: data.message || data.detail || 'Request failed',
          code: data.code || `HTTP_${response.status}`,
          details: typeof data === 'object' ? data : { raw: data },
          timestamp: data.timestamp,
          requestId: requestId,
          rateLimit: rateLimit
        })
      }
    }
    
    // Create network error for non-business errors
    return new SunraNetworkError(
      response?.status || 0,
      response?.statusText || error.message,
      requestId,
      rateLimit
    )
  }
  
  // Handle internal errors
  if (error instanceof SunraError) {
    return error
  }
  
  // Wrap other errors
  return new SunraError({
    message: error.message || 'Unknown error',
    code: 'unknown',
    details: { stack: error.stack }
  })
}
```

#### 1.3 Update Request Methods
```typescript
// src/request.ts - Update dispatchRequest function
export async function dispatchRequest<Input, Output>(
  params: RequestParams<Input>,
): Promise<Output> {
  const axiosInstance = params?.config?.axios ?? axios
  const axiosConfig = getAxiosConfig(params)

  try {
    const response = await axiosInstance.request(axiosConfig)
    return response.data
  } catch (error) {
    throw extractSunraError(error)
  }
}
```

#### 1.4 Add onError Support
```typescript
// src/types.ts - Update options interfaces
export interface SunraRunOptions<Input> {
  input: Input
  onError?: (error: SunraError) => void // New optional callback
}

export interface QueueSubscribeOptions {
  onError?: (error: SunraError) => void // New optional callback
  // ... existing options
}
```

#### 1.5 Update Client Methods
```typescript
// src/client.ts - Update subscribe method
export class SunraClientImpl implements SunraClient {
  async subscribe(
    endpointId: string, 
    options: SunraRunOptions<any> & QueueSubscribeOptions
  ): Promise<SunraResult<any>> {
    try {
      const { request_id: requestId } = await this.queue.submit(endpointId, options)
      if (options.onEnqueue) {
        options.onEnqueue(requestId)
      }
      await this.queue.subscribeToStatus({ requestId, ...options })
      return this.queue.result({ requestId })
    } catch (error) {
      const sunraError = extractSunraError(error)
      if (options.onError) {
        options.onError(sunraError)
        return // Don't throw if onError is provided
      }
      throw sunraError
    }
  }
}
```

### Phase 2: Python SDK Enhancements

#### 2.1 Update SunraClientError Class
```python
# src/sunra_client/exceptions.py
from typing import Dict, Any, Optional

class SunraClientError(Exception):
    """Exception raised when Sunra API operations fail."""

    def __init__(
        self,
        message: str,
        code: str | None = None,
        error_type: str | None = None,
        details: Dict[str, Any] | None = None,
        timestamp: str | None = None,
        request_id: str | None = None,
        rate_limit: Dict[str, int] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.type = error_type
        self.details = details
        self.timestamp = timestamp
        self.request_id = request_id
        self.rate_limit = rate_limit

    def to_dict(self) -> dict:
        """Convert error to dictionary format."""
        error_obj = {
            "code": self.code or "UNKNOWN_ERROR",
            "message": self.message
        }
        
        if self.type:
            error_obj["type"] = self.type
        if self.details:
            error_obj["details"] = self.details
        
        result = {"error": error_obj}
        
        if self.timestamp:
            result["timestamp"] = self.timestamp
        if self.request_id:
            result["request_id"] = self.request_id
        if self.rate_limit:
            result["rate_limit"] = self.rate_limit
            
        return result

    def __str__(self) -> str:
        parts = []
        if self.code:
            parts.append(self.code)
        if self.message:
            parts.append(self.message)
        if self.details:
            parts.append(f"Details: {self.details}")
        if self.timestamp:
            parts.append(f"Timestamp: {self.timestamp}")
        if self.request_id:
            parts.append(f"Request ID: {self.request_id}")
        return " | ".join(parts)
```

#### 2.2 Update Error Extraction Function
```python
# src/sunra_client/client.py - Update _raise_for_status function
def _extract_rate_limit_from_headers(headers) -> Dict[str, int] | None:
    """Extract rate limit information from response headers."""
    try:
        limit = headers.get('x-ratelimit-limit')
        remaining = headers.get('x-ratelimit-remaining')
        reset = headers.get('x-ratelimit-reset')
        
        if limit is not None and remaining is not None and reset is not None:
            return {
                'limit': int(limit),
                'remaining': int(remaining),
                'reset': int(reset)
            }
    except (ValueError, TypeError):
        pass
    
    return None

def _raise_for_status(response: httpx.Response) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        request_id = response.headers.get('x-request-id')
        rate_limit = _extract_rate_limit_from_headers(response.headers)
        
        try:
            error_data = response.json()

            # Check if there's a nested error object (common API pattern)
            if "error" in error_data and isinstance(error_data["error"], dict):
                error_obj = error_data["error"]
                message = error_obj.get("message", "Request failed")
                code = error_obj.get("code", str(response.status_code))
                error_type = error_obj.get("type")
                details = error_obj.get("details")
                timestamp = error_data.get("timestamp")
            else:
                # Fallback to top-level fields for legacy responses
                message = error_data.get("detail", response.text)
                code = error_data.get("code", str(response.status_code))
                error_type = error_data.get("type")
                details = error_data.get("details")
                timestamp = error_data.get("timestamp")

        except (ValueError, KeyError):
            message = response.text or f"HTTP {response.status_code}"
            code = str(response.status_code)
            error_type = "network_error"
            details = {"status_code": response.status_code, "response_text": response.text}
            timestamp = None

        raise SunraClientError(
            message=message,
            code=code,
            error_type=error_type,
            details=details,
            timestamp=timestamp,
            request_id=request_id,
            rate_limit=rate_limit
        ) from exc
```

#### 2.3 Add onError Support to Client Methods
```python
# src/sunra_client/client.py - Update method signatures
def subscribe(
    self,
    application: str,
    arguments: AnyJSON,
    *,
    path: str = "",
    on_enqueue: Callable[[str], None] | None = None,
    with_logs: bool = True,
    on_queue_update: Callable[[Status], None] | None = None,
    on_error: Callable[[SunraClientError], None] | None = None,  # New parameter
) -> AnyJSON | None:
    try:
        handle = self.submit(application, arguments, path=path, with_logs=with_logs)
        
        if on_enqueue is not None:
            on_enqueue(handle.request_id)

        if on_queue_update is not None:
            for event in handle.iter_events():
                on_queue_update(event)

        return handle.get()
    except SunraClientError as e:
        if on_error is not None:
            on_error(e)
            return None  # Don't raise if onError is provided
        raise
```

### Phase 3: Java SDK Enhancements

#### 3.1 Update SunraException Class
```java
// client/src/main/java/ai/sunra/client/exception/SunraException.java
public class SunraException extends RuntimeException {
    @Nullable
    private final String requestId;
    @Nullable
    private final String code;
    @Nullable
    private final String type;
    @Nullable
    private final Object details;
    @Nullable
    private final String timestamp;
    @Nullable
    private final RateLimitInfo rateLimit;

    // Enhanced constructor with all fields
    public SunraException(
            @Nonnull String message,
            @Nullable String code,
            @Nullable String type,
            @Nullable Object details,
            @Nullable String timestamp,
            @Nullable String requestId,
            @Nullable RateLimitInfo rateLimit) {
        super(requireNonNull(message));
        this.requestId = requestId;
        this.code = code;
        this.type = type;
        this.details = details;
        this.timestamp = timestamp;
        this.rateLimit = rateLimit;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> error = new HashMap<>();
        error.put("code", code != null ? code : "UNKNOWN_ERROR");
        error.put("message", getMessage());
        if (type != null) error.put("type", type);
        if (details != null) error.put("details", details);
        result.put("error", error);
        
        if (timestamp != null) result.put("timestamp", timestamp);
        if (requestId != null) result.put("request_id", requestId);
        if (rateLimit != null) result.put("rate_limit", rateLimit.toMap());
        
        return result;
    }

    // Getters for new fields
    @Nullable
    public String getType() {
        return type;
    }

    @Nullable
    public Object getDetailsObject() {
        return details;
    }

    @Nullable
    public RateLimitInfo getRateLimit() {
        return rateLimit;
    }

    public static class RateLimitInfo {
        private final int limit;
        private final int remaining;
        private final int reset;
        
        public RateLimitInfo(int limit, int remaining, int reset) {
            this.limit = limit;
            this.remaining = remaining;
            this.reset = reset;
        }

        public int getLimit() { return limit; }
        public int getRemaining() { return remaining; }
        public int getReset() { return reset; }
        
        public Map<String, Integer> toMap() {
            Map<String, Integer> map = new HashMap<>();
            map.put("limit", limit);
            map.put("remaining", remaining);
            map.put("reset", reset);
            return map;
        }
    }
}
```

#### 3.2 Update Error Extraction in HttpClient
```java
// client/src/main/java/ai/sunra/client/http/HttpClient.java - Update responseToException method
private SunraException.RateLimitInfo extractRateLimitFromHeaders(Response response) {
    try {
        String limit = response.header("x-ratelimit-limit");
        String remaining = response.header("x-ratelimit-remaining");
        String reset = response.header("x-ratelimit-reset");
        
        if (limit != null && remaining != null && reset != null) {
            return new SunraException.RateLimitInfo(
                Integer.parseInt(limit),
                Integer.parseInt(remaining),
                Integer.parseInt(reset)
            );
        }
    } catch (NumberFormatException e) {
        // Ignore parsing errors
    }
    
    return null;
}

public SunraException responseToException(Response response) {
    final var requestId = response.header("x-request-id");
    final var rateLimit = extractRateLimitFromHeaders(response);
    final var contentType = response.header("content-type");

    String message = "Request failed with code: " + response.code();
    String code = String.valueOf(response.code());
    String type = null;
    Object details = null;
    String timestamp = null;

    if (contentType != null && contentType.contains("application/json")) {
        final var body = response.body();
        if (body != null) {
            try {
                final var json = gson.fromJson(body.charStream(), JsonElement.class);
                if (json != null && json.isJsonObject() && !json.isJsonNull()) {
                    final var jsonObject = json.getAsJsonObject();

                    // Check if there's a nested error object (common API pattern)
                    if (jsonObject.has("error")) {
                        final var errorElement = jsonObject.get("error");
                        if (errorElement != null && !errorElement.isJsonNull() && errorElement.isJsonObject()) {
                            final var errorObject = errorElement.getAsJsonObject();

                            if (errorObject.has("message")) {
                                message = errorObject.get("message").getAsString();
                            }
                            if (errorObject.has("code")) {
                                code = errorObject.get("code").getAsString();
                            }
                            if (errorObject.has("type")) {
                                type = errorObject.get("type").getAsString();
                            }
                            if (errorObject.has("details")) {
                                details = gson.fromJson(errorObject.get("details"), Object.class);
                            }
                        }
                    } else {
                        // Fallback to top-level fields for legacy responses
                        if (jsonObject.has("detail")) {
                            message = jsonObject.get("detail").getAsString();
                        }
                        if (jsonObject.has("code")) {
                            code = jsonObject.get("code").getAsString();
                        }
                        if (jsonObject.has("type")) {
                            type = jsonObject.get("type").getAsString();
                        }
                        if (jsonObject.has("details")) {
                            details = gson.fromJson(jsonObject.get("details"), Object.class);
                        }
                    }

                    // Extract top-level fields
                    if (jsonObject.has("timestamp")) {
                        timestamp = jsonObject.get("timestamp").getAsString();
                    }

                    // If details is still null for network errors, use the full JSON as details
                    if (details == null && type == null) {
                        details = gson.fromJson(json, Object.class);
                        type = "network_error";
                    }
                }
            } catch (Exception e) {
                // If JSON parsing fails, use the raw response text
                try {
                    details = Map.of("raw_response", body.string(), "status_code", response.code());
                    type = "network_error";
                } catch (Exception ignored) {
                    // Use default values
                }
            }
        }
    }

    return new SunraException(message, code, type, details, timestamp, requestId, rateLimit);
}
```

#### 3.3 Add OnError Callback Support
```java
// client/src/main/java/ai/sunra/client/SubscribeOptions.java
public class SubscribeOptions<ResultType> extends ApiOptions {
    @Nullable
    private Consumer<SunraException> onError; // New field

    public static class Builder<ResultType> {
        // Add onError method to builder
        public Builder<ResultType> onError(Consumer<SunraException> onError) {
            this.onError = onError;
            return this;
        }
    }
}
```

#### 3.4 Update Queue Client Error Handling
```java
// client/src/main/java/ai/sunra/client/queue/QueueClientImpl.java - Update error handling in subscribeToStatus
if (!completed.isSuccess()) {
    String errorMessage = "Request failed";
    String code = null;
    String type = null;
    Object details = null;
    String timestamp = null;

    if (completed.getError() != null && !completed.getError().isJsonNull() && completed.getError().isJsonObject()) {
        final var errorObject = completed.getError().getAsJsonObject();
        if (errorObject.has("message")) {
            errorMessage = errorObject.get("message").getAsString();
        }
        if (errorObject.has("code")) {
            code = errorObject.get("code").getAsString();
        }
        if (errorObject.has("type")) {
            type = errorObject.get("type").getAsString();
        }
        if (errorObject.has("details")) {
            details = httpClient.fromJson(errorObject.get("details"), Object.class);
        }
        if (errorObject.has("timestamp")) {
            timestamp = errorObject.get("timestamp").getAsString();
        }
    }

    future.completeExceptionally(new SunraException(
        errorMessage, code, type, details, timestamp, options.getRequestId(), null));
    eventSource.cancel();
    return;
}
```

#### 3.5 Update Client Implementation
```java
// client/src/main/java/ai/sunra/client/SunraClientImpl.java
@Override
public <O> Output<O> subscribe(String endpointId, SubscribeOptions<O> options) {
    try {
        final var submitted = this.queue.submit(endpointId, options);
        final var requestId = submitted.getRequestId();
        
        if (options.getOnEnqueue() != null) {
            options.getOnEnqueue().accept(requestId);
        }
        
        final var subscribeOptions = QueueSubscribeOptions.builder()
                .requestId(requestId)
                .onQueueUpdate(options.getOnQueueUpdate())
                .logs(options.isLogs())
                .build();
                
        this.queue.subscribeToStatus(subscribeOptions);
        return this.queue.result(QueueResultOptions.of(requestId, options.getResultType()));
    } catch (SunraException e) {
        if (options.getOnError() != null) {
            options.getOnError().accept(e);
            return null; // Don't throw if onError is provided
        }
        throw e;
    }
}
```

### Phase 4: Documentation and Examples Updates

#### 4.1 Update Error Handling Examples
- Update `examples/demo-nodejs/src/error-handling.ts` to use new error classes
- Update `examples/demo-python/error-handling.py` to demonstrate new features
- Create new Java error handling examples

#### 4.2 Update READMEs
- Document new error structure in all SDK READMEs
- Provide examples of onError callback usage
- Document migration guide from old error handling

### Phase 5: Testing

#### 5.1 Unit Tests
- Test error extraction for various response formats
- Test onError callback functionality
- Test backward compatibility

#### 5.2 Integration Tests
- Test real API error scenarios
- Test cross-SDK consistency
- Test error handling in streaming scenarios

## Migration Strategy

### For Existing Users

1. **Backward Compatibility**: Existing error handling code should continue to work
2. **Gradual Migration**: Users can opt-in to new error handling patterns
3. **Deprecation Warnings**: Add warnings for old patterns in documentation

### Breaking Changes

- None planned for major version bump
- New features are additive and optional

## Success Metrics

1. **Consistency**: All SDKs provide identical error structures for same scenarios
2. **Simplicity**: Users no longer need to manually destructure axios responses
3. **Documentation**: Clear, simple error handling documentation
4. **Developer Experience**: Reduced support tickets related to error handling

## Timeline

- **Week 1**: Phase 1 - JavaScript/TypeScript SDK implementation
- **Week 2**: Phase 2 - Python SDK enhancements  
- **Week 3**: Phase 3 - Java SDK enhancements
- **Week 4**: Phase 4 - Documentation and examples
- **Week 5**: Phase 5 - Testing and validation

## Risks and Mitigation

1. **Breaking Changes**: Mitigated by maintaining backward compatibility
2. **Complex Migration**: Mitigated by providing clear migration guides
3. **Performance Impact**: Mitigated by efficient error extraction logic

## Future Enhancements

1. **Error Retry Logic**: Automatic retry for certain error types
2. **Error Analytics**: Collect error metrics for service improvement  
3. **Custom Error Handlers**: Allow users to register custom error processing logic 

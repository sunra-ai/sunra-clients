
---
description: This document defines the role and responsibilities of a Java SDK Developer for the Sunra Clients project. The Java SDK provides synchronous, asynchronous, and Kotlin-compatible client libraries for interacting with Sunra.ai services.
globs:
alwaysApply: false
---

# Sunra Clients - Java SDK Developer Role Document

## Overview
This document defines the role and responsibilities of a Java SDK Developer for the Sunra Clients project. The Java SDK provides synchronous, asynchronous, and Kotlin-compatible client libraries for interacting with Sunra.ai services.

## Project Structure
The Java SDK consists of three main modules:
- **client/**: Main synchronous Java client
- **client-async/**: Asynchronous Java client implementation
- **client-kotlin/**: Kotlin-specific client with coroutines support

## Development Guidelines

### 1. Code Style and Standards

#### Java Style Guide
- Follow **Google Java Style Guide** conventions
- Use **2 spaces** for indentation (as per user preference)
- Maximum line length: **120 characters**
- Use **PascalCase** for class names: `SunraClient`, `QueueClient`
- Use **camelCase** for method names: `submitRequest`, `getStatus`
- Use **UPPER_SNAKE_CASE** for constants: `DEFAULT_TIMEOUT`, `MAX_RETRIES`

#### Kotlin Style Guide
- Follow **Kotlin Coding Conventions**
- Use **2 spaces** for indentation
- Prefer **data classes** for DTOs and configuration objects
- Use **nullable types** appropriately: `String?` instead of `Optional<String>`
- Leverage **coroutines** for asynchronous operations

### 2. Architecture Patterns

#### Client Architecture
```java
// Synchronous client pattern
public class SunraClient {
  private final HttpClient httpClient;
  private final CredentialsResolver credentialsResolver;
  private final QueueClient queueClient;

  public static SunraClient withEnvCredentials() {
    return new SunraClientImpl(CredentialsResolver.fromEnvironment());
  }
}

// Asynchronous client pattern
public class AsyncSunraClient {
  public CompletableFuture<Output> subscribe(String endpointId, SubscribeOptions options) {
    return CompletableFuture.supplyAsync(() -> {
      // Implementation
    });
  }
}
```

#### Kotlin Client Pattern
```kotlin
// Kotlin coroutines pattern
class SunraClient {
  suspend fun <T> subscribe(
    endpointId: String,
    input: Map<String, Any>,
    options: SubscribeOptions = SubscribeOptions()
  ): RequestOutput<T> {
    // Implementation using coroutines
  }
}
```

### 3. Error Handling

#### Exception Hierarchy
- **SunraException**: Base exception for all Sunra-related errors
- **SunraValidationException**: Input validation errors
- **SunraApiException**: API-specific errors (HTTP errors, rate limits)
- **SunraTimeoutException**: Request timeout errors

#### Error Handling Patterns
```java
// Synchronous error handling
try {
  Output result = client.subscribe(endpointId, options);
  return result;
} catch (SunraValidationException e) {
  // Handle validation errors
  throw new IllegalArgumentException("Invalid input: " + e.getMessage(), e);
} catch (SunraException e) {
  // Handle general Sunra errors
  logger.error("Sunra API error: {}", e.getMessage(), e);
  throw e;
}

// Asynchronous error handling
CompletableFuture<Output> future = client.subscribe(endpointId, options)
  .exceptionally(throwable -> {
    if (throwable instanceof SunraException) {
      // Handle Sunra-specific errors
    }
    return null;
  });
```

### 4. HTTP Client Implementation

#### OkHttp Integration
```java
public class HttpClient {
  private final OkHttpClient okHttpClient;

  public HttpClient(ClientConfig config) {
    this.okHttpClient = new OkHttpClient.Builder()
      .addInterceptor(new CredentialsInterceptor(config.getCredentialsResolver()))
      .addInterceptor(new ClientProxyInterceptor())
      .connectTimeout(config.getConnectTimeout(), TimeUnit.MILLISECONDS)
      .readTimeout(config.getReadTimeout(), TimeUnit.MILLISECONDS)
      .build();
  }
}
```

#### Request/Response Handling
- Use **Jackson** for JSON serialization/deserialization
- Implement proper **Content-Type** headers
- Handle **multipart/form-data** for file uploads
- Support **Server-Sent Events** for streaming responses

### 5. Queue Operations

#### Queue Client Interface
```java
public interface QueueClient {
  QueueSubmitResult submit(String endpointId, QueueSubmitOptions options);
  QueueStatus status(QueueStatusOptions options);
  Output result(QueueResultOptions options);
  void cancel(QueueCancelOptions options);
  Output subscribe(String endpointId, QueueSubscribeOptions options);
}
```

#### Implementation Patterns
- Use **Builder pattern** for options classes
- Implement **polling mechanism** for status checks
- Support **callback functions** for status updates
- Handle **timeout scenarios** gracefully

### 6. Configuration Management

#### ClientConfig Structure
```java
public class ClientConfig {
  private final CredentialsResolver credentialsResolver;
  private final String apiEndpoint;
  private final String queueDomain;
  private final Duration connectTimeout;
  private final Duration readTimeout;
  private final int maxRetries;

  // Builder pattern implementation
  public static class Builder {
    // Builder methods
  }
}
```

#### Environment Variable Support
- **SUNRA_KEY**: API authentication key
- **SUNRA_API_ENDPOINT**: API endpoint URL
- **SUNRA_QUEUE_DOMAIN**: Queue service domain

### 7. Testing Standards

#### Unit Testing
- Use **JUnit 5** for testing framework
- Use **Mockito** for mocking dependencies
- Test **all public methods** and **error scenarios**
- Achieve **minimum 80% code coverage**

#### Integration Testing
```java
@Test
public void testRealApiIntegration() {
  // Only run with real API key
  assumeTrue(System.getenv("SUNRA_KEY") != null);

  SunraClient client = SunraClient.withEnvCredentials();
  Output result = client.subscribe("test-endpoint",
    SubscribeOptions.builder()
      .input(Map.of("prompt", "test"))
      .build());

  assertNotNull(result);
}
```

#### Test Organization
- **Unit tests**: `src/test/java/ai/sunra/client/`
- **Integration tests**: `src/test/java/ai/sunra/client/integration/`
- **Mock data**: `src/test/resources/`

### 8. Build and Dependency Management

#### Gradle Configuration
```kotlin
// build.gradle.kts
dependencies {
  implementation("com.squareup.okhttp3:okhttp:4.12.0")
  implementation("com.fasterxml.jackson.core:jackson-databind:2.16.0")
  implementation("org.slf4j:slf4j-api:2.0.9")

  // Kotlin-specific dependencies
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

  // Testing dependencies
  testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
  testImplementation("org.mockito:mockito-core:5.7.0")
}
```

#### Version Management
- Use **libs.versions.toml** for dependency version management
- Follow **semantic versioning** for releases
- Maintain **backward compatibility** within major versions

### 9. Documentation Standards

#### JavaDoc Requirements
```java
/**
 * Submits a request to the Sunra queue for processing.
 *
 * @param endpointId the ID of the API endpoint to submit to
 * @param options the submission options including input data and callbacks
 * @return the queue submission result containing request ID and status
 * @throws SunraValidationException if the input parameters are invalid
 * @throws SunraException if the API request fails
 * @since 1.0.0
 */
public QueueSubmitResult submit(String endpointId, QueueSubmitOptions options) {
  // Implementation
}
```

#### Code Examples
- Include **working examples** in JavaDoc
- Provide **usage patterns** for common scenarios
- Document **error handling** approaches
- Show **configuration options**

### 10. Performance Considerations

#### Connection Management
- Use **connection pooling** for HTTP clients
- Implement **keep-alive** for persistent connections
- Handle **connection timeouts** appropriately
- Support **retry mechanisms** with exponential backoff

#### Memory Management
- Avoid **memory leaks** in long-running operations
- Use **streaming** for large file uploads
- Implement **proper resource cleanup**
- Monitor **garbage collection** impact

### 11. Security Best Practices

#### Credential Handling
- Never **log credentials** in plain text
- Use **environment variables** for sensitive data
- Implement **credential rotation** support
- Validate **API key formats** before use

#### Input Validation
- Validate **all user inputs** before processing
- Sanitize **file paths** and **URLs**
- Implement **size limits** for uploads
- Check **content types** for file uploads

### 12. Kotlin-Specific Guidelines

#### Coroutines Usage
```kotlin
class SunraClient {
  suspend fun subscribe(endpointId: String, options: SubscribeOptions): RequestOutput<JsonObject> {
    return withContext(Dispatchers.IO) {
      // Async implementation
    }
  }

  fun subscribeAsync(endpointId: String, options: SubscribeOptions): Deferred<RequestOutput<JsonObject>> {
    return GlobalScope.async {
      subscribe(endpointId, options)
    }
  }
}
```

#### Extension Functions
- Use **extension functions** for utility methods
- Implement **DSL builders** for configuration
- Leverage **operator overloading** where appropriate
- Use **inline functions** for performance-critical code

### 13. Common Patterns

#### Builder Pattern Implementation
```java
public class SubscribeOptions {
  private final Map<String, Object> input;
  private final Consumer<String> onEnqueue;
  private final Consumer<QueueUpdate> onQueueUpdate;
  private final boolean logs;

  public static class Builder {
    public Builder input(Map<String, Object> input) { /* ... */ }
    public Builder onEnqueue(Consumer<String> callback) { /* ... */ }
    public Builder onQueueUpdate(Consumer<QueueUpdate> callback) { /* ... */ }
    public Builder logs(boolean logs) { /* ... */ }
    public SubscribeOptions build() { /* ... */ }
  }
}
```

#### Callback Handling
- Use **functional interfaces** for callbacks
- Support **lambda expressions** in Java 8+
- Implement **error callbacks** for failure scenarios
- Provide **progress callbacks** for long operations

### 14. Release and Publishing

#### Maven Central Publishing
- Configure **GPG signing** for releases
- Include **source and javadoc** JARs
- Maintain **proper POM metadata**
- Follow **Maven Central requirements**

#### Version Compatibility
- Maintain **API compatibility** within major versions
- Document **breaking changes** in release notes
- Provide **migration guides** for major upgrades
- Support **multiple Java versions** (8, 11, 17, 21)

### 15. Monitoring and Logging

#### Logging Standards
```java
private static final Logger logger = LoggerFactory.getLogger(SunraClient.class);

public Output subscribe(String endpointId, SubscribeOptions options) {
  logger.debug("Submitting request to endpoint: {}", endpointId);

  try {
    Output result = processRequest(endpointId, options);
    logger.info("Request completed successfully: {}", result.getRequestId());
    return result;
  } catch (Exception e) {
    logger.error("Request failed for endpoint: {}", endpointId, e);
    throw e;
  }
}
```

#### Metrics Collection
- Track **request latency** and **success rates**
- Monitor **connection pool** usage
- Log **retry attempts** and **failures**
- Implement **health checks** for dependencies

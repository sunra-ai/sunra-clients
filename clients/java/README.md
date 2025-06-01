## The sunra.ai JVM Client for Java and Kotlin

![License](https://img.shields.io/badge/license-MIT-blue)

## About the Project

The `sunraClient` is a robust and user-friendly Java implementation of the [sunra.ai](https://sunra.ai) client.

## Getting Started

The `sunraClient` library serves as a client for sunra serverless Python functions. Before using this library, ensure you've got your sunra key from [our dashboard](https://sunra.ai/dashboard/keys).

The client is available on Maven Central. There are three different modules:

- `sunra-client`: The main client library, implemented in Java, with synchronous interfaces.
- `sunra-client-async`: The asynchronous version of the client library, implemented in Java.
- `sunra-client-kotlin`: The Kotlin version of the client library, with coroutines support, implemented on top of the `sunra-client-async` module.

The

### Client Library

#### Synchronous

##### Install

```groovy
implementation "ai.sunra.client:sunra-client:0.1.0"
```

##### Call the API

```java
import ai.sunra.client.*;

var sunra = SunraClient.withEnvCredentials();

var input = Map.of(
    "prompt", "A cute shih-tzu puppy"
);
var result = sunra.subscribe("sunra/lcm/text-to-image",
    SubscribeOptions.<JsonObject>builder()
        .input(input)
        .resultType(JsonObject.class)
        .onQueueUpdate(update -> {
            System.out.println(update.getStatus());
        })
        .build()
);
System.out.println(result.getRequestId());
System.out.println(result.getData());
```

#### Asynchronous

##### Install

```groovy
implementation "ai.sunra.client:sunra-client-async:0.1.0"
```

##### Call the API

```java
import ai.sunra.client.*;

var sunra = AsyncSunraClient.withEnvCredentials();

var input = Map.of(
    "prompt", "A cute shih-tzu puppy"
);
var future = sunra.subscribe("sunra/lcm/text-to-image",
    SubscribeOptions.<JsonObject>builder()
        .input(input)
        .resultType(JsonObject.class)
        .onQueueUpdate(update -> {
            System.out.println(update.getStatus());
        })
        .build()
);
future.thenAccept(result -> {
    System.out.println(result.getRequestId());
    System.out.println(result.getData());
});
```

#### Kotlin

##### Install

```groovy
implementation "ai.sunra.client:sunra-client-kotlin:0.1.0"
```

##### Call the API

```kotlin
import ai.sunra.client.kt.*

val sunra = createsunraClient()

val result = sunra.subscribe("sunra/lcm/text-to-image", input = mapOf(
    "prompt" to "A cute shih-tzu puppy"
)) { update ->
    print(update.status)
}
print(result.requestId)
print(result.data)
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make to the Kotlin version of the client are **greatly appreciated**.

## License

Distributed under the MIT License. See [LICENSE](https://github.com/sunra-ai/serverless-client-swift/blob/main/LICENSE) for more information.

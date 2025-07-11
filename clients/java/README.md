# The sunra.ai JVM Client for Java and Kotlin

![License](https://img.shields.io/badge/license-Apache%20License%202.0-blue)

## About the Project

The `SunraClient` is a robust and user-friendly Java implementation of the [sunra.ai](https://sunra.ai) client library.

## Getting Started

The `SunraClient` library serves as a client for sunra.ai applications and AI models. Before using this library, you'll need to:

1. Sign up at [sunra.ai](https://sunra.ai)
2. Get your API key from the [dashboard](https://sunra.ai/dashboard/keys)
3. Set your API key as an environment variable: `export SUNRA_KEY=your-api-key`

The client is available on Maven Central. There are three different modules:

- `sunra-client`: The main client library, implemented in Java, with synchronous interfaces.
- `sunra-client-async`: The asynchronous version of the client library, implemented in Java.
- `sunra-client-kotlin`: The Kotlin version of the client library, with coroutines support, implemented on top of the `sunra-client-async` module.

## Client Library

### Synchronous

#### Install

```groovy
implementation "ai.sunra.client:sunra-client:0.1.0"
```

#### Call the API

```java
import ai.sunra.client.*;

var sunra = SunraClient.withEnvCredentials();

var input = Map.of(
    "prompt", "A cute shih-tzu puppy"
);
var result = sunra.subscribe("black-forest-labs/flux-kontext-pro/text-to-image",
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

### Asynchronous

#### Install

```groovy
implementation "ai.sunra.client:sunra-client-async:0.1.0"
```

#### Call the API

```java
import ai.sunra.client.*;

var sunra = AsyncSunraClient.withEnvCredentials();

var input = Map.of(
    "prompt", "A cute shih-tzu puppy"
);
var future = sunra.subscribe("black-forest-labs/flux-kontext-pro/text-to-image",
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

### Kotlin

#### Install

```groovy
implementation "ai.sunra.client:sunra-client-kotlin:0.1.0"
```

#### Call the API

```kotlin
import ai.sunra.client.kt.*

val sunra = createSunraClient()

val result = sunra.subscribe("black-forest-labs/flux-kontext-pro/text-to-image", input = mapOf(
    "prompt" to "A cute shih-tzu puppy"
)) { update ->
    print(update.status)
}
print(result.requestId)
print(result.data)
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## License

Distributed under the Apache License 2.0. See [LICENSE](../../LICENSE) for more information.

## Credits

This project is derived from:

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original projects are licensed under the MIT/Apache 2.0 License. We extend our gratitude to the original authors for their contributions.

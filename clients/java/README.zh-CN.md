# sunra.ai JVM 客户端 (适用于 Java 和 Kotlin)

[English](./README.md) | 简体中文

![许可证](https://img.shields.io/badge/license-Apache%20License%202.0-blue)

## 关于项目

`SunraClient` 是 [sunra.ai](https://sunra.ai) 客户端库的一个健壮且用户友好的 Java 实现。

## 社区

加入我们的 [Discord 社区](https://discord.gg/W9F3tveq)，与其他开发者联系、获取帮助，并随时了解最新的功能和公告。

## 入门

`SunraClient` 库用作 sunra.ai 应用程序和 AI 模型的客户端。在使用此库之前，您需要：

1. 在 [sunra.ai](https://sunra.ai) 注册
2. 从 [仪表板](https://sunra.ai/dashboard/keys) 获取您的 API 密钥
3. 将您的 API 密钥设置为环境变量：`export SUNRA_KEY=your-api-key`

该客户端可在 Maven Central 上获取。有三个不同的模块：

- `sunra-client`: 主要的客户端库，用 Java 实现，具有同步接口。
- `sunra-client-async`: 客户端库的异步版本，用 Java 实现。
- `sunra-client-kotlin`: 客户端库的 Kotlin 版本，支持协程，基于 `sunra-client-async` 模块实现。

## 客户端库

### 同步

#### 安装

```groovy
implementation "ai.sunra.client:sunra-client:0.1.6"
```

#### 调用 API

```java
import ai.sunra.client.*;

var sunra = SunraClient.withEnvCredentials();

var input = Map.of(
    "prompt", "一只可爱的西施犬幼犬"
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

### 异步

#### 安装

```groovy
implementation "ai.sunra.client:sunra-client-async:0.1.6"
```

#### 调用 API

```java
import ai.sunra.client.*;

var sunra = AsyncSunraClient.withEnvCredentials();

var input = Map.of(
    "prompt", "一只可爱的西施犬幼犬"
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

#### 安装

```groovy
implementation "ai.sunra.client:sunra-client-kotlin:0.1.6"
```

#### 调用 API

```kotlin
import ai.sunra.client.kt.*

val sunra = createSunraClient()

val result = sunra.subscribe("black-forest-labs/flux-kontext-pro/text-to-image", input = mapOf(
    "prompt" to "一只可爱的西施犬幼犬"
)) { update ->
    print(update.status)
}
print(result.requestId)
print(result.data)
```

## 贡献

贡献是使开源社区成为一个学习、启发和创造的绝佳场所的原因。我们 **非常感谢** 您所做的任何贡献。

## 许可证

根据 Apache 2.0 许可证分发。更多信息请参见 [LICENSE](../../LICENSE)。

## 致谢

该项目源自：

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

并已适配以与 sunra.ai 协同工作。原始项目根据 MIT/Apache 2.0 许可证授权。我们对原始作者的贡献表示感谢。


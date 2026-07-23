# sunra.ai 客户端库

[English](./README.md) | 简体中文

[![许可证](https://img.shields.io/github/license/sunra-ai/sunra-clients?style=flat-square)](./LICENSE)
[![@sunra/client npm 包](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=JavaScript&style=flat-square)](https://www.npmjs.com/package/@sunra/client)
[![PyPI - 版本](https://img.shields.io/pypi/v/sunra_client)](https://pypi.org/project/sunra_client)
[![Maven Central 版本](https://img.shields.io/maven-central/v/ai.sunra.client/sunra-client)](https://search.maven.org/artifact/ai.sunra.client/sunra-client)
[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

## 关于项目

本仓库包含 [sunra.ai](https://sunra.ai) 的官方客户端库，该平台用于部署和运行 AI 模型。这些库提供了强大且用户友好的界面，用于将 sunra.ai 端点集成到您使用多种编程语言的应用程序中。

## 可用的客户端库

### 🐍 Python 客户端
- **位置**: [`clients/python/`](./clients/python/)
- **包**: `sunra-client` (PyPI)
- **特性**: 同步和异步支持、流式响应、文件上传
- **安装**: `pip install sunra-client`

### 📦 JavaScript/TypeScript 客户端
- **位置**: [`clients/javascript/`](./clients/javascript/)
- **包**: `@sunra/client` (npm)
- **特性**: 可在 Web、Node.js 和 React Native 环境中工作
- **安装**: `npm install @sunra/client`

### ☕ Java 客户端
- **位置**: [`clients/java/`](./clients/java/)
- **包**: `ai.sunra.client:sunra-client` (Maven Central)
- **特性**: 同步、异步和 Kotlin 协程支持
- **安装**: `implementation "ai.sunra.client:sunra-client:0.1.6"`

## 快速入门

在使用任何客户端库之前，您需要：

1. 在 [sunra.ai](https://sunra.ai) 注册
2. 从 [仪表板](https://sunra.ai/dashboard/api-tokens) 获取您的 API 密钥
3. 将您的 API 密钥设置为环境变量：`export SUNRA_KEY=your-api-key`

### Python 示例

```python
import sunra_client

# 简单同步调用
result = sunra_client.subscribe(
    "openai/gpt-image-2/text-to-image",
    arguments={"prompt": "a cute cat, realistic, orange", "quality": "high"}
)
print(result["images"][0]["url"])

# 异步调用
async def main():
    result = await sunra_client.subscribe_async(
        "openai/gpt-image-2/text-to-image",
        arguments={"prompt": "a cute cat, realistic, orange", "quality": "high"}
    )
    print(result["images"][0]["url"])
```

### JavaScript 示例

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  credentials: process.env.SUNRA_KEY,
});

const result = await sunra.subscribe(
  "openai/gpt-image-2/text-to-image",
  {
    input: {
      prompt: "a cute cat, realistic, orange",
      quality: "high"
    }
  }
);
console.log(result.images[0].url);
```

## LLM API

Sunra 的 LLM 端点兼容标准 OpenAI 和 Anthropic API 格式。使用对应的官方 SDK，并将基础 URL 设置为 `https://api-llm.sunra.ai/v1`；无需安装单独的 Sunra LLM 包。

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.SUNRA_KEY,
  baseURL: "https://api-llm.sunra.ai/v1",
});

const completion = await client.chat.completions.create({
  model: "google/gemini-2.5-flash",
  messages: [{ role: "user", content: "Hello" }],
  provider: { only: ["google-vertexai"] },
});
```

省略 `provider` 时使用自动路由。详细说明见 [LLM 文档](https://docs.sunra.ai/zh-Hans/llm/llm-quickstart)，本仓库也提供可运行的 Node.js 和 Python 示例。

### Java 示例

```java
import ai.sunra.client.*;

var sunra = SunraClient.withEnvCredentials();

var result = sunra.subscribe(
    "openai/gpt-image-2/text-to-image",
    SubscribeOptions.<JsonObject>builder()
        .input(Map.of(
            "prompt", "a cute cat, realistic, orange",
            "quality", "high"
        ))
        .resultType(JsonObject.class)
        .build()
);
System.out.println(result.getData());
```

## 服务器代理

对于客户端应用程序，我们提供了一个服务器代理来安全地处理 API 调用，而无需暴露您的凭据。适用于流行的框架：

- **位置**: [`server-proxy/`](./server-proxy/)
- **包**: `@sunra/server-proxy` (npm)
- **支持**: Next.js, Express, Hono, Remix, SvelteKit

## MCP 服务器 (模型上下文协议)

MCP 服务器为 AI 模型工具提供了一个通用接口，实现了与现代代码助手和 IDE（如 Cursor 和 Claude Desktop）的无缝集成。它充当 sunra.ai 和您的开发环境之间的桥梁，通过[模型上下文协议](https://github.com/modelcontextprotocol)暴露 Sunra 的模型和工具。

**为什么要使用 MCP 服务器？**
- 使代码助手（如 Cursor、Claude 等）能够直接从您的编辑器访问 Sunra 模型和工具
- 支持列出模型、获取模式、提交作业、流式传输结果等
- 安全：API 密钥通过环境变量或运行时配置进行管理
- 无需编写胶水代码——只需运行服务器并连接您的工具

### 快速入门

#### 1. 安装并运行 (无需本地构建)

```bash
npx @sunra/mcp-server --transport http --port 3925
```

#### 2. 对于 Cursor IDE
- 添加到您的 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "url": "http://localhost:3925/sse"
    }
  }
}
```
- 设置您的 API 密钥:
  ```bash
  export SUNRA_KEY="your-api-key-here"
  ```
- 在 Cursor 中，选择 `sunra-mcp-server` 并使用 `list-models`、`model-schema` 等工具。

#### 3. 对于 Claude Desktop (Anthropic)
- 在 stdio 模式下启动服务器（默认）：
  ```bash
  npx @sunra/mcp-server
  ```
- 在 Claude Desktop 设置中，添加一个新的 MCP 服务器：
  - **类型:** 本地可执行文件
  - **命令:** `npx @sunra/mcp-server`
  - **环境变量:**
    ```
    SUNRA_KEY=your-api-key-here
    ```
- 在 Claude 中，选择 `sunra-mcp-server` 并使用可用的工具。

#### 4. 高级用法和文档
- 有关完整的工具列表、开发和故障排除，请参阅 [`mcp-server/README.md`](./mcp-server/README.md)。

## 示例

该仓库包含了针对不同框架和用例的全面示例：

- **Next.js 应用**: [`examples/demo-nextjs-app-router/`](./examples/demo-nextjs-app-router/) 和 [`examples/demo-nextjs-page-router/`](./examples/demo-nextjs-page-router/)
- **Node.js**: [`examples/demo-nodejs/`](./examples/demo-nodejs/)
- **Express**: [`examples/demo-express-app/`](./examples/demo-express-app/)
- **Java**: [`examples/demo-java/`](./examples/demo-java/)
- **Java 异步**: [`examples/demo-java-async/`](./examples/demo-java-async/)
- **Kotlin**: [`examples/demo-kotlin/`](./examples/demo-kotlin/)
- **Python**: [`examples/demo-python/`](./examples/demo-python/)

## 开发

要设置开发环境：

1. 克隆仓库
2. 安装依赖：`pnpm i -r`
3. 设置您的 API 密钥：`export SUNRA_KEY=your-api-key`
4. 根据需要运行示例或测试

## 贡献

贡献是使开源社区成为一个学习、启发和创造的绝佳场所的原因。我们 **非常感谢** 您所做的任何贡献。

1.  请确保您已阅读我们的[行为准则](./CODE_OF_CONDUCT.md)
2.  Fork 项目并克隆您的 fork
3.  使用 `npm install` 设置本地环境
4.  创建一个功能分支 (`git checkout -b feat/add-cool-thing`) 或错误修复分支 (`git checkout -b fix/smash-that-bug`)
5.  提交更改 (`git commit -m 'feat(client): added a cool thing'`) - 使用[约定式提交](https://conventionalcommits.org)
6.  推送到分支 (`git push --set-upstream origin feat/add-cool-thing`)
7.  开启一个 Pull Request

查看 [good first issue 队列](https://github.com/sunra-ai/sunra-clients/labels/good+first+issue)，欢迎您的贡献！

## 许可证

根据 Apache 2.0 许可证分发。更多信息请参见 [LICENSE](./LICENSE)。

## 致谢

该项目源自：

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

并已适配以与 sunra.ai 协同工作。原始项目根据 MIT/Apache 2.0 许可证授权。我们对原始作者的贡献表示感谢。

# sunra.ai Client Libraries

[English](./README.md) | [简体中文](./README.zh-CN.md)

[![License](https://img.shields.io/github/license/sunra-ai/sunra-clients?style=flat-square)](./LICENSE)
[![@sunra/client npm package](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=JavaScript&style=flat-square)](https://www.npmjs.com/package/@sunra/client)
[![PyPI - Version](https://img.shields.io/pypi/v/sunra_client)](https://pypi.org/project/sunra_client)
[![Maven Central Version](https://img.shields.io/maven-central/v/ai.sunra.client/sunra-client)](https://search.maven.org/artifact/ai.sunra.client/sunra-client)

## About the Project

This repository contains the official client libraries for [sunra.ai](https://sunra.ai), a platform for deploying and running AI models. The libraries provide robust and user-friendly interfaces for integrating sunra.ai endpoints into your applications across multiple programming languages.

## Available Client Libraries

### 🐍 Python Client
- **Location**: [`clients/python/`](./clients/python/)
- **Package**: `sunra-client` (PyPI)
- **Features**: Synchronous and asynchronous support, streaming responses, file uploads
- **Installation**: `pip install sunra-client`

### 📦 JavaScript/TypeScript Client
- **Location**: [`clients/javascript/`](./clients/javascript/)
- **Package**: `@sunra/client` (npm)
- **Features**: Works in Web, Node.js, and React Native environments
- **Installation**: `npm install @sunra/client`

### ☕ Java Client
- **Location**: [`clients/java/`](./clients/java/)
- **Package**: `ai.sunra.client:sunra-client` (Maven Central)
- **Features**: Synchronous, asynchronous, and Kotlin coroutine support
- **Installation**: `implementation "ai.sunra.client:sunra-client:0.1.6"`

## Quick Start

Before using any client library, you'll need to:

1. Sign up at [sunra.ai](https://sunra.ai)
2. Get your API key from the [dashboard](https://sunra.ai/dashboard/keys)
3. Set your API key as an environment variable: `export SUNRA_KEY=your-api-key`

### Python Example

```python
import sunra_client

# Simple synchronous call
result = sunra_client.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    arguments={"prompt": "a cute cat, realistic, orange"}
)
print(result["images"][0]["url"])

# Asynchronous call
async def main():
    result = await sunra_client.subscribe_async(
        "black-forest-labs/flux-kontext-pro/text-to-image",
        arguments={"prompt": "a cute cat, realistic, orange"}
    )
    print(result["images"][0]["url"])
```

### JavaScript Example

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  credentials: process.env.SUNRA_KEY,
});

const result = await sunra.subscribe(
  "black-forest-labs/flux-kontext-pro/text-to-image",
  {
    input: {
      prompt: "a cute cat, realistic, orange"
    }
  }
);
console.log(result.images[0].url);
```

### Java Example

```java
import ai.sunra.client.*;

var sunra = SunraClient.withEnvCredentials();

var result = sunra.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    SubscribeOptions.<JsonObject>builder()
        .input(Map.of("prompt", "a cute cat, realistic, orange"))
        .resultType(JsonObject.class)
        .build()
);
System.out.println(result.getData());
```

## Server Proxy

For client-side applications, we provide a server proxy to securely handle API calls without exposing your credentials. Available for popular frameworks:

- **Location**: [`server-proxy/`](./server-proxy/)
- **Package**: `@sunra/server-proxy` (npm)
- **Supports**: Next.js, Express, Hono, Remix, SvelteKit

## MCP Server (Model Context Protocol)

The MCP server provides a universal interface for AI model tools, enabling seamless integration with modern code assistants and IDEs such as Cursor and Claude Desktop. It acts as a bridge between Sunra.ai and your development environment, exposing Sunra's models and tools via the [Model Context Protocol](https://github.com/modelcontextprotocol).

**Why use the MCP server?**
- Enables code assistants (like Cursor, Claude, etc.) to access Sunra models and tools directly from your editor
- Supports listing models, fetching schemas, submitting jobs, streaming results, and more
- Secure: API keys are managed via environment variables or runtime configuration
- No need to write glue code—just run the server and connect your tool

### Quick Start

#### 1. Install & Run (no local build needed)

```bash
npx @sunra/mcp-server --transport http --port 3925
```

#### 2. For Cursor IDE
- Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sunra-mcp-server": {
      "url": "http://localhost:3925/sse"
    }
  }
}
```
- Set your API key:
  ```bash
  export SUNRA_KEY="your-api-key-here"
  ```
- In Cursor, select the `sunra-mcp-server` and use tools like `list-models`, `model-schema`, etc.

#### 3. For Claude Desktop (Anthropic)
- Start the server in stdio mode (default):
  ```bash
  npx @sunra/mcp-server
  ```
- In Claude Desktop settings, add a new MCP server:
  - **Type:** Local executable
  - **Command:** `npx @sunra/mcp-server`
  - **Environment Variables:**
    ```
    SUNRA_KEY=your-api-key-here
    ```
- In Claude, select the `sunra-mcp-server` and use the available tools.

#### 4. Advanced Usage & Documentation
- See [`mcp-server/README.md`](./mcp-server/README.md) for full tool list, development, and troubleshooting.

## Examples

The repository includes comprehensive examples for different frameworks and use cases:

- **Next.js Apps**: [`examples/demo-nextjs-app-router/`](./examples/demo-nextjs-app-router/) and [`examples/demo-nextjs-page-router/`](./examples/demo-nextjs-page-router/)
- **Node.js**: [`examples/demo-nodejs/`](./examples/demo-nodejs/)
- **Express**: [`examples/demo-express-app/`](./examples/demo-express-app/)
- **Java**: [`examples/demo-java/`](./examples/demo-java/)
- **Java Async**: [`examples/demo-java-async/`](./examples/demo-java-async/)
- **Kotlin**: [`examples/demo-kotlin/`](./examples/demo-kotlin/)
- **Python**: [`examples/demo-python/`](./examples/demo-python/)

## Development

To set up the development environment:

1. Clone the repository
2. Install dependencies: `pnpm i -r`
3. Set up your API key: `export SUNRA_KEY=your-api-key`
4. Run examples or tests as needed

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Make sure you read our [Code of Conduct](./CODE_OF_CONDUCT.md)
2. Fork the project and clone your fork
3. Setup the local environment with `npm install`
4. Create a feature branch (`git checkout -b feat/add-cool-thing`) or a bugfix branch (`git checkout -b fix/smash-that-bug`)
5. Commit the changes (`git commit -m 'feat(client): added a cool thing'`) - use [conventional commits](https://conventionalcommits.org)
6. Push to the branch (`git push --set-upstream origin feat/add-cool-thing`)
7. Open a Pull Request

Check the [good first issue queue](https://github.com/sunra-ai/sunra-clients/labels/good+first+issue), your contribution will be welcome!

## License

Distributed under the Apache 2.0 License. See [LICENSE](./LICENSE) for more information.

## Credits

This project is derived from:

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original projects are licensed under the MIT/Apache 2.0 License. We extend our gratitude to the original authors for their contributions.

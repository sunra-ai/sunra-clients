# sunra.ai Client Libraries

![License](https://img.shields.io/github/license/sunra-ai/sunra-clients?style=flat-square)
![@sunra/client npm package](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=JavaScript&style=flat-square)
![PyPI - Version](https://img.shields.io/pypi/v/sunra_client)
![Maven Central Version](https://img.shields.io/maven-central/v/ai.sunra.client/sunra-client)

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
- **Installation**: `implementation "ai.sunra.client:sunra-client:0.1.4"`

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

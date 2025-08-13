# sunra.ai 服务器代理库

[English](./README.md) | 简体中文

[![@sunra/server-proxy npm 包](https://img.shields.io/npm/v/@sunra/server-proxy?color=%237527D7&label=%40sunra%2Fserver-proxy&style=flat-square)](https://www.npmjs.com/package/@sunra/server-proxy)
[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

## 简介

`@sunra/server-proxy` 库使您能够通过自己的服务器路由客户端请求，从而保护敏感凭据。通过对 Next.js 和 Express 等流行框架的内置支持，设置代理变得轻而易举。

### 安装

```bash
npm install --save @sunra/server-proxy
```

## Next.js 页面路由集成

对于使用页面路由的 Next.js 应用程序：

1. 在您的 Next.js 应用程序中创建一个 API 路由，按照惯例我们建议使用 `pages/api/sunra/proxy.js`（如果您使用 TypeScript，则使用 `.ts`）
2. 将库中的代理处理程序重新导出为默认导出：

   ```typescript
   export { handler as default } from "@sunra/server-proxy/nextjs";
   ```

3. 确保您已在服务器中将 `SUNRA_KEY` 设置为环境变量，其中包含有效的 API 密钥。

## Next.js 应用路由集成

对于使用应用路由的 Next.js 应用程序：

1. 在您的 Next.js 应用程序中创建一个 API 路由，按照惯例我们建议使用 `app/api/sunra/proxy/route.js`（如果您使用 TypeScript，则使用 `.ts`）
2. 将库中的代理处理程序重新导出为默认导出：

   ```typescript
   import { route } from "@sunra/server-proxy/nextjs";

   export const { GET, POST, PUT } = route;
   ```

3. 确保您已在服务器中将 `SUNRA_KEY` 设置为环境变量，其中包含有效的 API 密钥。

## Express 集成

对于 Express 应用程序：

1. 确保您的应用程序支持 JSON 负载，可以使用 `express.json()`（推荐）或 `body-parser`：

   ```typescript
   app.use(express.json());
   ```

2. 添加代理路由及其处理程序。请注意，如果您的客户端位于 express 应用程序之外（即 express 应用程序仅用作其他客户端的外部 API），则需要在代理路由上允许 CORS：

   ```typescript
   import * as sunraProxy from "@sunra/server-proxy/express";

   app.all(
     sunraProxy.route, // '/api/sunra/proxy' 或者您可以使用自己的路径
     cors(), // 如果外部客户端将使用代理
     sunraProxy.handler,
   );
   ```

3. 确保您已在服务器中将 `SUNRA_KEY` 设置为环境变量，其中包含有效的 API 密钥。

## 客户端配置

设置好代理后，您可以配置客户端使用它：

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  proxyUrl: "/api/sunra/proxy", // 或 https://my.app.com/api/sunra/proxy
});
```

现在，所有客户端调用都将通过您的服务器代理路由，因此您的凭据受到保护。

## 其他框架支持

代理库还支持其他流行的框架：

- **Hono**: `@sunra/server-proxy/hono`
- **Remix**: `@sunra/server-proxy/remix`
- **SvelteKit**: `@sunra/server-proxy/svelte`

## 更多信息

要深入了解代理库及其功能，请浏览[官方文档](https://docs.sunra.ai)。

## 致谢

该项目源自：

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

并已适配以与 sunra.ai 协同工作。原始项目根据 MIT/Apache 2.0 许可证授权。我们对原始作者的贡献表示感谢。

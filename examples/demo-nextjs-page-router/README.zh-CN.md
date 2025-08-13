# sunra.ai Next.js 页面路由示例

[English](./README.md) | 简体中文

[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

这是一个使用 [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app) 引导的 [Next.js](https://nextjs.org) 项目，并集成了 sunra.ai 客户端库。

## 入门指南

首先，获取您的 API 密钥：

1. 在 [sunra.ai](https://sunra.ai) 注册
2. 从[仪表板](https://sunra.ai/dashboard/keys)获取您的 API 密钥

然后设置您的环境变量：

```bash
cp .env.example .env.local
```

将您的 sunra.ai API 密钥添加到 `.env.local`：

```bash
SUNRA_KEY=your-api-key-here
```

然后，运行开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 功能特性

本示例演示了：

- **sunra.ai 集成** - 与 sunra.ai 客户端库的完整设置
- **服务器代理** - 通过服务器代理进行安全的 API 密钥处理
- **流式响应** - 实时 AI 模型执行更新
- **文件上传** - 图像和文件上传功能
- **现代 UI** - 使用 Tailwind CSS 和现代 React 模式构建

## sunra.ai 配置

该应用程序使用 sunra.ai 服务器代理进行安全的 API 调用。代理在 `pages/api/sunra/proxy.ts` 中配置：

```typescript
export { handler as default } from "@sunra/server-proxy/nextjs";
```

可以在 [http://localhost:3000/api/hello](http://localhost:3000/api/hello) 访问 [API 路由](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)。可以在 `pages/api/hello.ts` 中编辑此端点。

`pages/api` 目录映射到 `/api/*`。此目录中的文件被视为 [API 路由](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)，而不是 React 页面。

## 了解更多

要了解更多关于所使用技术的信息：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能和 API
- [sunra.ai 文档](https://docs.sunra.ai) - 了解 sunra.ai 功能和 API
- [学习 Next.js](https://nextjs.org/learn-pages-router) - 交互式 Next.js 教程

您可以查看 [Next.js GitHub 仓库](https://github.com/vercel/next.js) - 欢迎您的反馈和贡献！

## 部署到 Vercel

部署 Next.js 应用程序的最简单方法是使用 Next.js 创建者提供的 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)。

记得在 Vercel 部署设置中添加您的 `SUNRA_KEY` 环境变量。

查看我们的 [Next.js 部署文档](https://nextjs.org/docs/pages/building-your-application/deploying)了解更多详情。

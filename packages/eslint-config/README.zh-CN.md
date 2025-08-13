# `@sunra/eslint-config`

[English](./README.md) | 简体中文

[![npm package](https://img.shields.io/npm/v/@sunra/eslint-config?style=flat-square&color=%237527D7&label=npm)](https://www.npmjs.com/package/@sunra/eslint-config)
[![Discord](https://img.shields.io/discord/897qCzvCcU?style=flat-square&logo=discord&label=Discord&color=5865F2)](https://discord.gg/897qCzvCcU)

sunra.ai 客户端库的内部 ESLint 配置集合。

## 用途

此包包含 sunra.ai 客户端库中使用的 ESLint 配置，以确保一致的代码质量和风格。

## 可用配置

- `base.js` - 基础 ESLint 配置
- `next.js` - Next.js 特定配置
- `react-internal.js` - React 内部配置

## 在 ESLint 配置中使用

```javascript
// eslint.config.mjs
import { config } from '@repo/eslint-config/base'

/** @type {import("eslint").Linter.Config} */
export default config
```

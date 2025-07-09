# `@sunra/eslint-config`

Collection of internal ESLint configurations for the sunra.ai client libraries.

## Usage

This package contains ESLint configurations used across the sunra.ai client libraries to ensure consistent code quality and style.

## Available Configurations

- `base.js` - Base ESLint configuration
- `next.js` - Next.js specific configuration
- `react-internal.js` - React internal configuration

## Usage in ESLint Config

```javascript
// eslint.config.mjs
import { config } from '@repo/eslint-config/base'

/** @type {import("eslint").Linter.Config} */
export default config
```

# sunra.ai JavaScript/TypeScript 客户端库

[English](./README.md) | 简体中文

![@sunra/client npm package](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=%40sunra%2Fclient&style=flat-square)

## 简介

[sunra.ai](https://sunra.ai) JavaScript 客户端库提供了一种无缝的方式，从您的 JavaScript 或 TypeScript 应用程序与 [sunra.ai](https://sunra.ai) 端点进行交互。它内置了对各种平台的支持，确保在 Web、Node.js 和 React Native 环境中行为一致。

## 社区

加入我们的 [Discord 社区](https://discord.gg/W9F3tveq)，与其他开发者联系、获取帮助，并随时了解最新的功能和公告。

## 入门

在使用客户端之前，您需要：

1. 在 [sunra.ai](https://sunra.ai) 注册
2. 从 [仪表板](https://sunra.ai/dashboard/keys) 获取您的 API 密钥
3. 将您的 API 密钥设置为环境变量：`export SUNRA_KEY=your-api-key`

然后设置您的凭据：

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  credentials: process.env.SUNRA_KEY,
});
```

或直接导入内置客户端
```typescript
import { sunra } from '@sunra/client' // 默认使用 process.env.SUNRA_KEY 作为凭据
```

**注意：** 请确保您的凭据始终受到保护。请参阅 [../../server-proxy](../../server-proxy) 包，了解在客户端应用程序中安全使用客户端的方法。

## 运行函数而不等待结果

```typescript
const { request_id } = await sunra.queue.submit(
  "black-forest-labs/flux-kontext-pro/text-to-image",
  {
    input: {
      prompt: "一个玻璃茶壶，里面有盛开的花茶，放在阳光明媚的窗户旁的木桌上，光线柔和。"
    },
  }
);
```

## 使用 `sunra.subscribe` 的长时运行函数

`sunra.subscribe` 方法提供了一种强大的方式来依赖队列系统执行长时运行的函数。它在完成后返回结果，就像任何其他异步函数一样，因此您无需自己处理队列状态更新。但是，它确实支持队列事件，以防您想要监听并对其作出反应：

```typescript
const result = await sunra.subscribe(
  "black-forest-labs/flux-kontext-pro/text-to-image",
  {
    input: {
      prompt: "一个玻璃茶壶，里面有盛开的花茶，放在阳光明媚的窗户旁的木桌上，光线柔和。"
    },
    onQueueUpdate(update) {
      if (update.status === "IN_QUEUE") {
        console.log(`您在队列中的位置是 ${update.position}`);
      }
    },
  }
);
```

## 错误处理

客户端为常见场景提供了适当的错误处理：

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  credentials: process.env.SUNRA_KEY,
});

try {
  const result = await sunra.subscribe(
    "black-forest-labs/flux-kontext-pro/text-to-image",
    {
      input: {
        prompt: "一只可爱的猫，逼真，橘色"
      }
    }
  );
  console.log(result.images[0]?.url);
} catch (error) {
  console.error("错误:", error.message);
}
```

## HTTP 代理配置

客户端通过自定义 Axios 实例支持 HTTP 代理配置。当您需要通过公司代理路由请求或用于开发目的时，这非常有用。

### 基本代理设置

```typescript
import { sunra } from '@sunra/client'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

// 创建一个带有代理配置的自定义 Axios 实例
const proxyAxios = axios.create({
  httpsAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890')
})

// 配置 sunra 客户端以使用您的自定义 Axios 实例
sunra.config({
  axios: proxyAxios
})

// 现在所有 sunra 请求都将使用代理
const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
  input: {
    prompt: '床上和地板上堆满杂乱物品的卧室',
    aspect_ratio: '16:9'
  }
})
```

### 高级代理配置

对于更高级的代理设置，您可以进一步自定义 Axios 实例：

```typescript
import { sunra } from '@sunra/client'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

const proxyAxios = axios.create({
  httpsAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'),
  timeout: 30000, // 30 秒超时
})

// 添加自定义标头或身份验证
proxyAxios.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  config.headers['User-Agent'] = 'my-custom-client'
  return config
})

sunra.config({
  axios: proxyAxios,
  credentials: process.env.SUNRA_KEY // 可选：也在此处设置凭据
})
```

**要求：**
- 安装 `https-proxy-agent` 包：`npm install https-proxy-agent`
- 将 `HTTPS_PROXY` 环境变量设置为您的代理 URL

## 文件上传

客户端支持接受文件输入的模型的文件上传。可以使用存储客户端上传文件：

```typescript
import { sunra } from '@sunra/client'
import { readFileSync } from 'fs';

// Node.js: 通过提供 Buffer 从本地路径上传文件
const imageBuffer = readFileSync('path/to/your/image.jpg');
const imageUrl = await sunra.storage.upload(imageBuffer);

/*
// 浏览器：从 <input type="file"> 元素上传 File 对象
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const fileUrl = await sunra.storage.upload(file);
}
*/

// 在您对图像到图像模型的请求中使用上传的文件 URL
const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/image-to-image', {
  input: {
    // 模型可能期望一个名为 'image_url'、'image_path' 或类似的参数
    image: imageUrl,
    prompt: '把它变成梵高风格的画作'
  }
});

console.log(result);
```

**文件上传限制：**
- 最大文件大小：**100MB**
- 支持格式：图像、视频、音频、文档以及特定模型支持的其他文件类型

## 更多功能

客户端库提供了大量功能，旨在简化您使用 sunra.ai 的旅程。请查阅[官方文档](https://docs.sunra.ai)以获取全面的指南。

## 致谢

该项目源自：

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

并已适配以与 sunra.ai 协同工作。原始项目根据 MIT/Apache 2.0 许可证授权。我们对原始作者的贡献表示感谢。


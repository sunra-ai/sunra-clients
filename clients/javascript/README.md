# sunra.ai JavaScript/TypeScript Client Library

![@sunra/client npm package](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=%40sunra%2Fclient&style=flat-square)

## Introduction

The [sunra.ai](https://sunra.ai) JavaScript Client Library provides a seamless way to interact with [sunra.ai](https://sunra.ai) endpoints from your JavaScript or TypeScript applications. With built-in support for various platforms, it ensures consistent behavior across web, Node.js, and React Native environments.

## Getting Started

Before using the client, you'll need to:

1. Sign up at [sunra.ai](https://sunra.ai)
2. Get your API key from the [dashboard](https://sunra.ai/dashboard/keys)
3. Set your API key as an environment variable: `export SUNRA_KEY=your-api-key`

Then set up your credentials:

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  credentials: process.env.SUNRA_KEY,
});
```

or directly import the builtin client
```typescript
import { sunra } from '@sunra/client' // use process.env.SUNRA_KEY as credentials by default
```

**Note:** Make sure your credentials are always protected. See the [../../server-proxy](../../server-proxy) package for a secure way to use the client in client-side applications.

## Running Functions Without Waiting for the Result

```typescript
const { request_id } = await sunra.queue.submit(
  "black-forest-labs/flux-kontext-pro/text-to-image",
  {
    input: {
      prompt: "A glass teapot with blooming flower tea inside, placed on a wooden table by a sunlit window with gentle morning light."
    },
  }
);
```

## Long-running Functions with `sunra.subscribe`

The `sunra.subscribe` method offers a powerful way to rely on the queue system to execute long-running functions. It returns the result once it's done like any other async function, so you don't have to deal with queue status updates yourself. However, it does support queue events, in case you want to listen and react to them:

```typescript
const result = await sunra.subscribe(
  "black-forest-labs/flux-kontext-pro/text-to-image",
  {
    input: {
      prompt: "A glass teapot with blooming flower tea inside, placed on a wooden table by a sunlit window with gentle morning light."
    },
    onQueueUpdate(update) {
      if (update.status === "IN_QUEUE") {
        console.log(`Your position in the queue is ${update.position}`);
      }
    },
  }
);
```

## Error Handling

The client provides proper error handling for common scenarios:

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
        prompt: "A cute cat, realistic, orange"
      }
    }
  );
  console.log(result.images[0]?.url);
} catch (error) {
  console.error("Error:", error.message);
}
```

## HTTP Proxy Configuration

The client supports HTTP proxy configuration through custom Axios instances. This is useful when you need to route requests through a corporate proxy or for development purposes.

### Basic Proxy Setup

```typescript
import { sunra } from '@sunra/client'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

// Create a custom Axios instance with proxy configuration
const proxyAxios = axios.create({
  httpsAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890')
})

// Configure the sunra client to use your custom Axios instance
sunra.config({
  axios: proxyAxios
})

// Now all sunra requests will use the proxy
const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
  input: {
    prompt: 'a bedroom with messy goods on the bed and floor',
    aspect_ratio: '16:9'
  }
})
```

### Advanced Proxy Configuration

For more advanced proxy setups, you can customize the Axios instance further:

```typescript
import { sunra } from '@sunra/client'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

const proxyAxios = axios.create({
  httpsAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'),
  timeout: 30000, // 30 seconds timeout
})

// Add custom headers or authentication
proxyAxios.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  config.headers['User-Agent'] = 'my-custom-client'
  return config
})

sunra.config({
  axios: proxyAxios,
  credentials: process.env.SUNRA_KEY // Optional: set credentials here too
})
```

**Requirements:**
- Install the `https-proxy-agent` package: `npm install https-proxy-agent`
- Set the `HTTPS_PROXY` environment variable to your proxy URL

## File Upload

The client supports file uploads for models that accept file inputs. Files can be uploaded using the storage client:

```typescript
import { sunra } from '@sunra/client'

// Upload a file
const fileUrl = await sunra.storage.upload(file)

// Use the uploaded file URL in your request
const result = await sunra.subscribe('model-endpoint', {
  input: {
    image: fileUrl,
    prompt: 'Process this image'
  }
})
```

**File Upload Limits:**
- Maximum file size: **100MB**
- Supported formats: Images, videos, audio, documents, and other file types as supported by the specific model

## More Features

The client library offers a plethora of features designed to simplify your journey with sunra.ai. Dive into the [official documentation](https://docs.sunra.ai) for a comprehensive guide.

## Credits

This project is derived from:

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original projects are licensed under the MIT/Apache 2.0 License. We extend our gratitude to the original authors for their contributions.

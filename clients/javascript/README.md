# sunra JavaScript/TypeScript client library

![@sunra/client npm package](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=%40sunra%2Fclient&style=flat-square)

## Introduction

The `sunra` JavaScript Client Library provides a seamless way to interact with `sunra` endpoints from your JavaScript or TypeScript applications. With built-in support for various platforms, it ensures consistent behavior across web, Node.js, and React Native environments.

## Getting started

Before diving into the client-specific features, ensure you've set up your credentials:

```ts
import { sunra } from "@sunra/client";

sunra.config({
  // Can also be auto-configured using environment variables:
  // Either a single SUNRA_KEY or a combination of SUNRA_KEY_ID and SUNRA_KEY_SECRET
  credentials: "SUNRA_KEY_ID:SUNRA_KEY_SECRET",
});
```

**Note:** Ensure you've reviewed the [sunra getting started guide](https://docs.sunra.ai) to acquire your credentials and register your functions. Also, make sure your credentials are always protected. See the [../proxy](../proxy) package for a secure way to use the client in client-side applications.

## Running functions without waiting for the result

```ts
const { request_id } = await sunra.queue.submit("my-function-id", {
  input: { foo: "bar" },
});
```

## Long-running functions with `sunra.subscribe`

The `sunra.subscribe` method offers a powerful way to rely on the queue system to execute long-running functions. It returns the result once it's done like any other async function, so your don't have to deal with queue status updates yourself. However, it does support queue events, in case you want to listen and react to them:

```ts
const result = await sunra.subscribe("my-function-id", {
  input: { foo: "bar" },
  onQueueUpdate(update) {
    if (update.status === "IN_QUEUE") {
      console.log(`Your position in the queue is ${update.position}`);
    }
  },
});
```

## More features

The client library offers a plethora of features designed to simplify your journey with `sunra`. Dive into the [official documentation](https://docs.sunra.ai) for a comprehensive guide.

## Credits

This project is derived from

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original project is licensed under the MIT/Apache2.0 License. We extend our gratitude to the original authors for their contributions.
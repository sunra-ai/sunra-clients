# The sunra.ai JS client

![@sunra/client npm package](https://img.shields.io/npm/v/@sunra/client?color=%237527D7&label=client&style=flat-square)
![@sunra/server-proxy npm package](https://img.shields.io/npm/v/@sunra/server-proxy?color=%237527D7&label=proxy&style=flat-square)
![Build](https://img.shields.io/github/actions/workflow/status/sunra-ai/sunra-clients/build.yml?style=flat-square)
![License](https://img.shields.io/github/license/sunra-ai/sunra-clients?style=flat-square)

## About the Project

The sunra JavaScript/TypeScript Client is a robust and user-friendly library designed for seamless integration of sunra endpoints in Web, Node.js, and React Native applications. Developed in TypeScript, it provides developers with type safety right from the start.

## Getting Started

The `@sunra/client` library serves as a client for sunra apps hosted on sunra. For guidance on consuming and creating apps, refer to the [quickstart guide](https://docs.sunra.ai).

### Client Library

This client library is crafted as a lightweight layer atop platform standards like `fetch`. This ensures a hassle-free integration into your existing codebase. Moreover, it addresses platform disparities, guaranteeing flawless operation across various JavaScript runtimes.

> **Note:**
> Ensure you've reviewed the [getting started guide](https://docs.sunra.ai) to acquire your credentials, browser existing APIs, or create your custom functions.

1. Install the client library
   ```sh
   npm install --save @sunra/client
   ```
2. Start by configuring your credentials:

   ```ts
  import { createSunraClient } from "@sunra/client";

  const sunra = createSunraClient({
    credentials: "SUNRA_KEY",
  });
   ```

3. Retrieve your function id and execute it:
   ```ts
   const result = await sunra.run("user/app-alias");
   ```

See the available [models](https://sunra.ai/models) for more details.

### The sunra client proxy

Although the sunra client is designed to work in any JS environment, including directly in your browser, **it is not recommended** to store your credentials in your client source code. The common practice is to use your own server to serve as a proxy to sunra APIs. Luckily sunra supports that out-of-the-box with plug-and-play proxy functions for the most common engines/frameworks.

For example, if you are using Next.js, you can:

1. Instal the proxy library
   ```sh
   npm install --save @sunra/server-proxy
   ```
2. Add the proxy as an API endpoint of your app, see an example here in [pages/api/sunra/proxy.ts](https://github.com/sunra-ai/sunra-clients/blob/main/apps/demo-nextjs-page-router/pages/api/sunra/proxy.ts)
   ```ts
   export { handler as default } from "@sunra/server-proxy/nextjs";
   ```
3. Configure the client to use the proxy:
  ```ts
  import { createSunraClient } from "@sunra/client";

  const sunra = createSunraClient({
    proxyUrl: "/api/sunra/proxy",
  });
  ```
4. Make sure your server has `SUNRA_KEY` as environment variable with a valid API Key. That's it! Now your client calls will route through your server proxy, so your credentials are protected.

See [server-proxy](./server-proxy/) for more details.

### The example Next.js app

You can find a minimal Next.js + sunra application examples in [examples/demo-nextjs-app-router/](https://github.com/sunra-ai/sunra-clients/blob/main/examples/demo-nextjs-app-router).

1. Run `npm install` on the repository root.
2. Create a `.env.local` file and add your API Key as `SUNRA_KEY` environment variable (or export it any other way your prefer).
3. Run `serve demo-nextjs-app-router` to start the Next.js app (`demo-nextjs-page-router` is also available if you're interested in the page router version).

## Roadmap

See the [open feature requests](https://github.com/sunra-ai/sunra-clients/labels/enhancement) for a list of proposed features and join the discussion.

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Make sure you read our [Code of Conduct](https://github.com/sunra-ai/sunra-clients/blob/main/CODE_OF_CONDUCT.md)
2. Fork the project and clone your fork
3. Setup the local environment with `npm install`
4. Create a feature branch (`git checkout -b feat/add-cool-thing`) or a bugfix branch (`git checkout -b fix/smash-that-bug`)
5. Commit the changes (`git commit -m 'feat(client): added a cool thing'`) - use [conventional commits](https://conventionalcommits.org)
6. Push to the branch (`git push --set-upstream origin feat/add-cool-thing`)
7. Open a Pull Request

Check the [good first issue queue](https://github.com/sunra-ai/sunra-clients/labels/good+first+issue), your contribution will be welcome!

## License

Distributed under the Apache 2.0 License. See [LICENSE](https://github.com/sunra-ai/sunra-clients/blob/main/LICENSE) for more information.

## Credits

This project is derived from

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original project is licensed under the MIT/Apache2.0 License. We extend our gratitude to the original authors for their contributions.

# The sunra.ai JS client

![@sunra-ai/client npm package](https://img.shields.io/npm/v/@sunra-ai/client?color=%237527D7&label=client&style=flat-square)
![@sunra-ai/server-proxy npm package](https://img.shields.io/npm/v/@sunra-ai/server-proxy?color=%237527D7&label=proxy&style=flat-square)
![Build](https://img.shields.io/github/actions/workflow/status/sunra-ai/sunra-js/build.yml?style=flat-square)
![License](https://img.shields.io/github/license/sunra-ai/sunra-js?style=flat-square)

## About the Project

The sunra JavaScript/TypeScript Client is a robust and user-friendly library designed for seamless integration of sunra endpoints in Web, Node.js, and React Native applications. Developed in TypeScript, it provides developers with type safety right from the start.

## Getting Started

The `@sunra-ai/client` library serves as a client for sunra apps hosted on sunra. For guidance on consuming and creating apps, refer to the [quickstart guide](https://sunra.ai/docs).

### Client Library

This client library is crafted as a lightweight layer atop platform standards like `fetch`. This ensures a hassle-free integration into your existing codebase. Moreover, it addresses platform disparities, guaranteeing flawless operation across various JavaScript runtimes.

> **Note:**
> Ensure you've reviewed the [getting started guide](https://sunra.ai/docs) to acquire your credentials, browser existing APIs, or create your custom functions.

1. Install the client library
   ```sh
   npm install --save @sunra-ai/client
   ```
2. Start by configuring your credentials:

   ```ts
   import { sunra } from "@sunra-ai/client";

   sunra.config({
     // Can also be auto-configured using environment variables:
     credentials: "SUNRA_KEY",
   });
   ```

3. Retrieve your function id and execute it:
   ```ts
   const result = await sunra.run("user/app-alias");
   ```

The result's type is contingent upon your Python function's output. Types in Python are mapped to their corresponding types in JavaScript.

See the available [model APIs](https://sunra.ai/models) for more details.

### The sunra client proxy

Although the sunra client is designed to work in any JS environment, including directly in your browser, **it is not recommended** to store your credentials in your client source code. The common practice is to use your own server to serve as a proxy to sunra APIs. Luckily sunra supports that out-of-the-box with plug-and-play proxy functions for the most common engines/frameworks.

For example, if you are using Next.js, you can:

1. Instal the proxy library
   ```sh
   npm install --save @sunra-ai/server-proxy
   ```
2. Add the proxy as an API endpoint of your app, see an example here in [pages/api/sunra/proxy.ts](https://github.com/sunra-ai/sunra-js/blob/main/apps/demo-nextjs-page-router/pages/api/sunra/proxy.ts)
   ```ts
   export { handler as default } from "@sunra-ai/server-proxy/nextjs";
   ```
3. Configure the client to use the proxy:
   ```ts
   import { sunra } from "@sunra-ai/client";
   sunra.config({
     proxyUrl: "/api/sunra/proxy",
   });
   ```
4. Make sure your server has `SUNRA_KEY` as environment variable with a valid API Key. That's it! Now your client calls will route through your server proxy, so your credentials are protected.

See [libs/proxy](./libs/proxy/) for more details.

### The example Next.js app

You can find a minimal Next.js + sunra application examples in [apps/demo-nextjs-page-router/](https://github.com/sunra-ai/sunra-js/blob/main/apps/demo-nextjs-page-router).

1. Run `npm install` on the repository root.
2. Create a `.env.local` file and add your API Key as `SUNRA_KEY` environment variable (or export it any other way your prefer).
3. Run `npx nx serve demo-nextjs-page-router` to start the Next.js app (`demo-nextjs-app-router` is also available if you're interested in the app router version).

Check our [Next.js integration docs](https://sunra.ai/docs/integrations/nextjs) for more details.

## Roadmap

See the [open feature requests](https://github.com/sunra-ai/sunra-js/labels/enhancement) for a list of proposed features and join the discussion.

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Make sure you read our [Code of Conduct](https://github.com/sunra-ai/sunra-js/blob/main/CODE_OF_CONDUCT.md)
2. Fork the project and clone your fork
3. Setup the local environment with `npm install`
4. Create a feature branch (`git checkout -b feature/add-cool-thing`) or a bugfix branch (`git checkout -b fix/smash-that-bug`)
5. Commit the changes (`git commit -m 'feat(client): added a cool thing'`) - use [conventional commits](https://conventionalcommits.org)
6. Push to the branch (`git push --set-upstream origin feature/add-cool-thing`)
7. Open a Pull Request

Check the [good first issue queue](https://github.com/sunra-ai/sunra-js/labels/good+first+issue), your contribution will be welcome!

## License

Distributed under the MIT License. See [LICENSE](https://github.com/sunra-ai/sunra-js/blob/main/LICENSE) for more information.

## Credits

This project is derived from [fal-ai/fal-js](https://github.com/fal-ai/fal-js) and adapted to work with sunra.ai. The original project is licensed under the MIT License. We extend our gratitude to the original authors for their contributions.
# sunra.ai Server Proxy Library

![@sunra/server-proxy npm package](https://img.shields.io/npm/v/@sunra/server-proxy?color=%237527D7&label=%40sunra%2Fserver-proxy&style=flat-square)

## Introduction

The `@sunra/server-proxy` library enables you to route client requests through your own server, therefore safeguarding sensitive credentials. With built-in support for popular frameworks like Next.js and Express, setting up the proxy becomes a breeze.

### Installation

```bash
npm install --save @sunra/server-proxy
```

## Next.js Page Router Integration

For Next.js applications using the page router:

1. Create an API route in your Next.js app, as a convention we suggest using `pages/api/sunra/proxy.js` (or `.ts` if you're using TypeScript)
2. Re-export the proxy handler from the library as the default export:

   ```typescript
   export { handler as default } from "@sunra/server-proxy/nextjs";
   ```

3. Ensure you've set the `SUNRA_KEY` as an environment variable in your server, containing a valid API Key.

## Next.js App Router Integration

For Next.js applications using the app router:

1. Create an API route in your Next.js app, as a convention we suggest using `app/api/sunra/proxy/route.js` (or `.ts` if you're using TypeScript)
2. Re-export the proxy handler from the library as the default export:

   ```typescript
   import { route } from "@sunra/server-proxy/nextjs";

   export const { GET, POST, PUT } = route;
   ```

3. Ensure you've set the `SUNRA_KEY` as an environment variable in your server, containing a valid API Key.

## Express Integration

For Express applications:

1. Make sure your app supports JSON payloads, either by using `express.json()` (recommended) or `body-parser`:

   ```typescript
   app.use(express.json());
   ```

2. Add the proxy route and its handler. Note that if your client lives outside of the express app (i.e. the express app is solely used as an external API for other clients), you will need to allow CORS on the proxy route:

   ```typescript
   import * as sunraProxy from "@sunra/server-proxy/express";

   app.all(
     sunraProxy.route, // '/api/sunra/proxy' or you can use your own
     cors(), // if external clients will use the proxy
     sunraProxy.handler,
   );
   ```

3. Ensure you've set the `SUNRA_KEY` as an environment variable in your server, containing a valid API Key.

## Client Configuration

Once you've set up the proxy, you can configure the client to use it:

```typescript
import { createSunraClient } from "@sunra/client";

const sunra = createSunraClient({
  proxyUrl: "/api/sunra/proxy", // or https://my.app.com/api/sunra/proxy
});
```

Now all your client calls will route through your server proxy, so your credentials are protected.

## Additional Framework Support

The proxy library also supports other popular frameworks:

- **Hono**: `@sunra/server-proxy/hono`
- **Remix**: `@sunra/server-proxy/remix`
- **SvelteKit**: `@sunra/server-proxy/svelte`

## More Information

For a deeper dive into the proxy library and its capabilities, explore the [official documentation](https://docs.sunra.ai).

## Credits

This project is derived from:

- [fal-ai/fal-js](https://github.com/fal-ai/fal-js)
- [fal-ai/fal-java](https://github.com/fal-ai/fal-java)
- [fal-ai/fal](https://github.com/fal-ai/fal/tree/main/projects/fal_client)

and adapted to work with sunra.ai. The original projects are licensed under the MIT/Apache 2.0 License. We extend our gratitude to the original authors for their contributions.

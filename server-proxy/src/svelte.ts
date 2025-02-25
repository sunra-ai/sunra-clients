import { type RequestHandler } from "@sveltejs/kit";
import { fromHeaders, handleRequest } from "./index";

type RequestHandlerParams = {
  /**
   * The credentials to use for the request. Usually comes from `$env/static/private`
   */
  credentials?: string | undefined;
};

/**
 * Creates the SvelteKit request handler for the sunra client proxy on App Router apps.
 * The passed credentials will be used to authenticate the request, if not provided the
 * environment variable `SUNRA_KEY` will be used.
 *
 * @param params the request handler parameters.
 * @returns the SvelteKit request handler.
 */
export const createRequestHandler = ({
  credentials,
}: RequestHandlerParams = {}) => {
  const handler: RequestHandler = async ({ request }) => {
    const SUNRA_KEY = credentials || process.env.SUNRA_KEY || "";
    const responseHeaders = new Headers({
      "Content-Type": "application/json",
    });
    return await handleRequest({
      id: "svelte-app-router",
      method: request.method,
      getRequestBody: async () => request.text(),
      getHeaders: () => fromHeaders(request.headers),
      getHeader: (name) => request.headers.get(name),

      // TODO: check if this is the correct way to set headers
      sendHeader: (name, value) => ((responseHeaders as any)[name] = value),
      resolveApiKey: () => Promise.resolve(SUNRA_KEY),
      respondWith: (status, data) =>
        new Response(JSON.stringify(data), {
          status,
          headers: responseHeaders,
        }),
      sendResponse: async (res) => {
        return new Response(res.body, res);
      },
    });
  };
  return {
    requestHandler: handler,
    GET: handler,
    POST: handler,
    PUT: handler,
  };
};

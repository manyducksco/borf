import { Type } from "@borf/bedrock";
import { ComponentCore } from "../component.js";

interface HTTPStoreInputs {
  /**
   * The fetch function to use for requests. Pass this to mock for testing.
   */
  fetch?: typeof window.fetch;
}

/**
 * A simple HTTP client with middleware support. Middleware applies to all requests made through this store,
 * so it's a perfect place to handle things like auth and permission checks for API calls.
 */
export function HTTPStore(self: ComponentCore<HTTPStoreInputs>) {
  self.setName("borf:http");

  let fetch = self.inputs.get("fetch")!;

  if (!fetch && typeof window !== "undefined" && window.fetch) {
    fetch = window.fetch.bind(window);
  }

  if (!fetch && typeof global !== "undefined" && global.fetch) {
    fetch = global.fetch.bind(global);
  }

  const middleware: RequestMiddleware[] = [];

  async function request<ResBody, ReqBody>(method: string, uri: string, options?: RequestOptions<any>) {
    return makeRequest<ResBody, ReqBody>({ ...options, method, uri, middleware, fetch });
  }

  return {
    /**
     * Adds a new middleware that will apply to subsequent requests.
     * Returns a function to remove this middleware.
     *
     * @param middleware - A middleware function that will intercept requests.
     */
    use(fn: RequestMiddleware) {
      middleware.push(fn);

      // Call returned function to remove this middleware for subsequent requests.
      return function remove() {
        middleware.splice(middleware.indexOf(fn), 1);
      };
    },

    async get<ResBody = unknown>(uri: string, options?: RequestOptions<never>) {
      return request<ResBody, never>("get", uri, options);
    },

    async put<ResBody = unknown, ReqBody = unknown>(uri: string, options?: RequestOptions<ReqBody>) {
      return request<ResBody, ReqBody>("put", uri, options);
    },

    async patch<ResBody = unknown, ReqBody = unknown>(uri: string, options?: RequestOptions<ReqBody>) {
      return request<ResBody, ReqBody>("patch", uri, options);
    },

    async post<ResBody = unknown, ReqBody = unknown>(uri: string, options?: RequestOptions<ReqBody>) {
      return request<ResBody, ReqBody>("post", uri, options);
    },

    async delete<ResBody = unknown>(uri: string, options?: RequestOptions<never>) {
      return request<ResBody, never>("delete", uri, options);
    },

    async head<ResBody = unknown, ReqBody = unknown>(uri: string, options?: RequestOptions<ReqBody>) {
      return request<ResBody, ReqBody>("head", uri, options);
    },

    async options<ResBody = unknown, ReqBody = unknown>(uri: string, options?: RequestOptions<ReqBody>) {
      return request<ResBody, ReqBody>("options", uri, options);
    },

    async trace<ResBody = unknown, ReqBody = unknown>(uri: string, options?: RequestOptions<ReqBody>) {
      return request<ResBody, ReqBody>("trace", uri, options);
    },
  };
}

/*====================*\
||      Request       ||
\*====================*/

export type RequestMiddleware = (
  request: HTTPRequest<unknown>,
  next: () => Promise<HTTPResponse<unknown>>
) => void | Promise<void>;

interface RequestOptions<ReqBody> {
  /**
   * Body to send with the request.
   */
  body?: ReqBody;

  /**
   * Headers to send with the request.
   */
  headers?: Record<string, string | number | boolean> | Headers;

  /**
   * Query params to interpolate into the URL.
   */
  query?: Record<string, string | number | boolean> | URLSearchParams;
}

interface HTTPRequest<Body> {
  method: string;
  uri: string;
  headers: Headers;
  query: URLSearchParams;
  body: Body;
}

interface HTTPResponse<Body> {
  method: string;
  uri: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Body;
}

class HTTPResponseError extends Error {
  response;

  constructor(response: HTTPResponse<any>) {
    const { status, statusText, method, uri } = response;
    const message = `${status} ${statusText}: Request failed (${method.toUpperCase()} ${uri})`;

    super(message);

    this.response = response;
  }
}

interface MakeRequestConfig<ReqBody> extends RequestOptions<ReqBody> {
  method: string;
  uri: string;
  middleware: RequestMiddleware[];
  fetch: typeof window.fetch;
}

async function makeRequest<ResBody, ReqBody>(config: MakeRequestConfig<ReqBody>) {
  const { headers, query, fetch, middleware } = config;

  const request: HTTPRequest<ReqBody> = {
    method: config.method,
    uri: config.uri,
    query: new URLSearchParams(),
    headers: new Headers(),
    body: config.body!,
  };

  // Read headers into request
  if (headers) {
    if (headers instanceof Map || headers instanceof Headers) {
      headers.forEach((value, key) => {
        request.headers.set(key, value);
      });
    } else if (Type.isObject(headers)) {
      for (const name in headers) {
        request.headers.set(name, String(headers[name]));
      }
    } else {
      throw new TypeError(`Unknown headers type. Got: ${headers}`);
    }
  }

  // Read query params into request
  if (query) {
    if (query instanceof Map || query instanceof Headers) {
      query.forEach((value, key) => {
        request.query.set(key, value);
      });
    } else if (Type.isObject(query)) {
      for (const name in query) {
        request.query.set(name, String(query[name]));
      }
    } else {
      throw new TypeError(`Unknown query params type. Got: ${query}`);
    }
  }

  let response: HTTPResponse<ResBody>;

  const handler = async () => {
    const query = request.query.toString();
    const fullURL = request.query.keys.length > 0 ? request.uri + "?" + query : request.uri;

    const fetched = await fetch(fullURL, {
      method: request.method,
      headers: request.headers,
      body: request.body as BodyInit,
    });

    // Auto-parse response body based on content-type header
    const headers = Object.fromEntries<string>(fetched.headers.entries());
    const contentType = headers["content-type"];

    let body: ResBody;

    if (contentType?.includes("application/json")) {
      body = await fetched.json();
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      body = (await fetched.formData()) as ResBody;
    } else {
      body = (await fetched.text()) as ResBody;
    }

    response = {
      method: request.method,
      uri: request.uri,
      status: fetched.status,
      statusText: fetched.statusText,
      headers: headers,
      body,
    };
  };

  if (middleware.length > 0) {
    const mount = (index = 0) => {
      const current = middleware[index];
      const next = middleware[index + 1] ? mount(index + 1) : handler;

      return async () =>
        current(request, async () => {
          await next();
          return response;
        });
    };

    await mount()();
  } else {
    await handler();
  }

  if (response!.status < 200 || response!.status >= 400) {
    throw new HTTPResponseError(response!);
  }

  return response!;
}

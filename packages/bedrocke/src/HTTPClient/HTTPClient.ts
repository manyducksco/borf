import { Type } from "../Type/Type.js";
import { List } from "../List/List.js";

/*====================*\
||       Client       ||
\*====================*/

export type HTTPClientConfig = {
  /**
   * Injectable custom `fetch` function for testing or mocking purposes.
   */
  fetch?: any;

  /**
   * Optional logging function. Called whenever the HTTPClient wants to print a message.
   */
  log?: (...args: any[]) => void;
};

export type MiddlewareFunction<ResponseBody, RequestBody> = (
  req: HTTPRequest<ResponseBody, RequestBody>,
  next: () => Promise<ResponseBody>
) => void | Promise<void>;

export class HTTPClient {
  #middleware = new List<MiddlewareFunction<any, any>>();
  #fetch = (global ?? window)?.fetch?.bind?.(global ?? window);

  constructor(config?: HTTPClientConfig) {
    if (config?.fetch) {
      this.#fetch = config.fetch;
    }
  }

  /**
   * Adds a new middleware that will apply to subsequent requests.
   * Returns a function to remove this middleware.
   *
   * @param middleware - A middleware function that will intercept requests.
   */
  use(middleware: MiddlewareFunction<any, any>) {
    this.#middleware.append(middleware);

    // Call returned function to remove this middleware for subsequent requests.
    return () => {
      this.#middleware.splice(this.#middleware.indexOf(middleware), 1);
    };
  }

  request<ResponseBody = unknown, RequestBody = unknown>(
    method: string,
    url: string,
    options?: HTTPRequestOptions<ResponseBody, RequestBody>
  ) {
    return new HTTPRequest<ResponseBody, RequestBody>({
      method,
      url,
      middleware: this.#middleware,
      fetch: this.#fetch,
      options,
    });
  }

  get<ResponseBody>(
    url: string,
    options?: HTTPRequestOptions<ResponseBody, void>
  ) {
    return this.request<ResponseBody, void>("get", url, options);
  }

  put<ResponseBody, RequestBody>(
    url: string,
    options?: HTTPRequestOptions<ResponseBody, RequestBody>
  ) {
    return this.request<ResponseBody, RequestBody>("put", url, options);
  }

  patch<ResponseBody, RequestBody>(
    url: string,
    options?: HTTPRequestOptions<ResponseBody, RequestBody>
  ) {
    return this.request<ResponseBody, RequestBody>("patch", url, options);
  }

  post<ResponseBody = unknown, RequestBody = unknown>(
    url: string,
    options?: HTTPRequestOptions<ResponseBody, RequestBody>
  ) {
    return this.request<ResponseBody, RequestBody>("post", url, options);
  }

  delete<ResponseBody = unknown>(
    url: string,
    options?: HTTPRequestOptions<ResponseBody, void>
  ) {
    return this.request<ResponseBody>("delete", url, options);
  }

  head<RequestBody = unknown>(
    url: string,
    options?: HTTPRequestOptions<void, RequestBody>
  ) {
    return this.request<void, RequestBody>("head", url, options);
  }

  options(url: string, options?: HTTPRequestOptions<void, void>) {
    return this.request<void, void>("options", url, options);
  }

  trace(url: string, options?: HTTPRequestOptions<void, void>) {
    return this.request<void, void>("trace", url, options);
  }
}

/*=====================*\
||       Request       ||
\*=====================*/

type HTTPRequestConfig<ResponseBody, RequestBody> = {
  method: string;
  url: string;
  fetch?: any;
  middleware: MiddlewareFunction<ResponseBody, RequestBody>[];
  options?: HTTPRequestOptions<ResponseBody, RequestBody>;
};

export type HTTPRequestOptions<ResponseBody, RequestBody> = {
  /**
   * Query params to interpolate into the URL.
   */
  query?: Map<string, string> | Record<string, string> | URLSearchParams;

  /**
   * Headers to send with the request.
   */
  headers?: Map<string, string> | Record<string, string> | Headers;

  /**
   * Body to send with the request.
   */
  body?: RequestBody;
};

class HTTPRequest<ResponseBody, RequestBody> {
  #method: string;
  #url: string;
  #query: URLSearchParams;
  #headers = new Headers();
  #body?: RequestBody;
  #middleware: List<MiddlewareFunction<ResponseBody, RequestBody>>;
  #parse?: (data: Response) => ResponseBody;
  #checkOK = (res: HTTPResponse<unknown>) =>
    res.status >= 200 && res.status < 300;

  #fetch;

  constructor({
    method,
    url,
    fetch,
    middleware,
    options,
  }: HTTPRequestConfig<ResponseBody, RequestBody>) {
    const [_url, query] = url.split("?");

    this.#method = method;
    this.#url = _url;
    this.#query = new URLSearchParams(query || "");
    this.#fetch = fetch;
    this.#middleware = new List(middleware);

    if (options) {
      if (!Type.isObject(options)) {
        throw new TypeError(`Options must be an object. Got: ${options}`);
      }

      if (options.query) {
        this.setQuery(options.query as Record<string, string>);
      }

      if (options.headers) {
        this.setHeaders(options.headers as Record<string, string>);
      }

      if (options.body) {
        this.setBody(options.body);
      }
    }
  }

  get isSameDomain() {
    return !/^https?:\/\//.test(this.#url);
  }

  /**
   * Returns a duplicated HTTPRequest with identical options.
   */
  clone() {
    return new HTTPRequest<ResponseBody, RequestBody>({
      method: this.#method,
      url: this.#url,
      fetch: this.#fetch,
      middleware: this.#middleware.toArray(),
      options: {
        query: this.#query,
        headers: this.#headers,
        body: this.#body,
      },
    });
  }

  /* ----- Method ----- */

  getMethod() {
    return this.#method;
  }

  setMethod(method: string) {
    this.#method = method;
    return this;
  }

  get method() {
    return this.getMethod();
  }

  set method(value: string) {
    this.setMethod(value);
  }

  /* ----- URL ----- */

  getURL() {
    return this.#url;
  }

  setURL(url: string) {
    this.#url = url;
    return this;
  }

  get url() {
    return this.getURL();
  }

  set url(url: string) {
    this.setURL(url);
  }

  /* ----- Headers ----- */

  getHeader(name: string) {
    return this.#headers.get(name);
  }

  setHeader(name: string, value: string) {
    this.#headers.set(name, value);
    return this;
  }

  getHeaders() {
    return Object.fromEntries(this.#headers.entries());
  }

  setHeaders(headers: Headers): this;
  setHeaders(headers: Map<string, string>): this;
  setHeaders(headers: Record<string, string>): this;

  setHeaders(headers: any) {
    if (Type.isMap<string, string>(headers) || headers instanceof Headers) {
      headers.forEach((value, key) => {
        this.#headers.set(key, value);
      });
    } else if (Type.isObject(Headers)) {
      for (const name in headers) {
        this.#headers.set(name, headers[name]);
      }
    } else {
      throw new TypeError(`Unknown headers type. Got: ${headers}`);
    }

    return this;
  }

  get headers() {
    return this.getHeaders();
  }

  /* ----- Body ----- */

  getBody() {
    return this.#body;
  }

  setBody(data: RequestBody) {
    this.#body = data;
    return this;
  }

  get body() {
    return this.getBody();
  }

  /* ----- Query Params ----- */

  getQuery(name?: string) {
    if (name) {
      if (!Type.isString(name)) {
        throw new TypeError(`Query param name must be a string. Got: ${name}`);
      }
      return this.#query.get(name);
    } else {
      return Object.fromEntries(this.#query.entries());
    }
  }

  setQuery(params: URLSearchParams): this;
  setQuery(params: Record<string, string>): this;
  setQuery(params: Map<string, string>): this;
  setQuery(name: string, value: string): this;

  setQuery(...args: any[]) {
    const params: Record<string, string> = {};

    if (args.length === 1 && Type.isObject(args[0])) {
      Object.assign(params, args[0]);
    } else if (args.length === 1 && Type.isMap<string, string>(args[0])) {
      for (const [key, value] of args[0].entries()) {
        params[key] = value;
      }
    } else if (args.length === 2 && Type.isString(args[0])) {
      const [name, value] = args;
      this.#query.set(name, value);
    } else {
      throw new TypeError(
        `Expected an object or a key and value. Got: ${args}`
      );
    }

    return this;
  }

  get query() {
    return this.getQuery();
  }

  /* ----- Error Handling / Validation ----- */

  checkOK(fn: (response: HTTPResponse<unknown>) => boolean) {
    this.#checkOK = fn;
    return this;
  }

  async send() {
    const res = HTTPResponse.fromRequest(this);

    const handler = async () => {
      const query = this.#query.toString();
      const fullURL =
        this.#query.keys.length > 0 ? this.#url + "?" + query : this.#url;

      const fetched = await this.#fetch(fullURL, {
        method: this.#method,
        headers: this.#headers,
        body: this.#body,
      });

      res.status = fetched.status;
      res.statusText = fetched.statusText;
      res.headers = Object.fromEntries<string>(fetched.headers.entries());

      const contentType = res.headers["content-type"];

      if (Type.isFunction(this.#parse)) {
        res.body = await this.#parse(fetched);
      } else if (contentType?.includes("application/json")) {
        res.body = await fetched.json();
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        res.body = await fetched.formData();
      } else {
        res.body = await fetched.text();
      }
    };

    if (this.#middleware.length > 0) {
      const mount = (index = 0) => {
        const current = this.#middleware[index];
        const next = this.#middleware[index + 1] ? mount(index + 1) : handler;

        return async () => current(this, next);
      };

      await mount()();
    } else {
      await handler();
    }

    if (!this.#checkOK(res)) {
      throw new HTTPResponseError(res);
    }

    return res as HTTPResponse<ResponseBody>;
  }
}

/*======================*\
||       Response       ||
\*======================*/

type HTTPResponseConfig = {
  method: string;
  url: string;
};

class HTTPResponse<Body> {
  static fromRequest(request: HTTPRequest<any, any>) {
    return new HTTPResponse({
      method: request.getMethod(),
      url: request.getURL(),
    });
  }

  method: string;
  url: string;
  status = 200;
  statusText = "OK";
  headers: Record<string, string> = {};
  body!: Body;

  constructor({ method, url }: HTTPResponseConfig) {
    this.method = method;
    this.url = url;
  }
}

class HTTPResponseError extends Error {
  response;

  constructor(response: HTTPResponse<any>) {
    const { status, statusText, method, url } = response;
    const message = `${status} ${statusText}: Request failed (${method.toUpperCase()} ${url})`;

    super(message);

    this.response = response;
  }
}

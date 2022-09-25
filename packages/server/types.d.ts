declare module "@woofjs/server" {
  export function makeApp(): App;

  interface App extends Router {
    server: import("http").Server;

    /**
     * Adds permissive CORS headers allowing browsers to call this API from any domain.
     */
    cors(): this;

    /**
     * Adds customized CORS headers to control how this API may be called in client apps served from other domains.
     *
     * @param config - CORS configuration options.
     */
    cors(config: CORSConfig): this;

    /**
     * Serves static files from the default static path.
     * This includes client builds and files in the project's `static` directory.
     */
    static(): this;

    /**
     * Serves static files that reside in a `source` folder on the local machine.
     *
     * @example
     * // Serve shibe's images at `/files`
     * app.static("/files", "/users/shibe/images");
     *
     * @param path - Path under which to serve the files.
     * @param source - Directory that contains the files to serve.
     */
    static(path: string, source: string): this;

    /**
     * Serves `static/index.html` as a fallback when no server routes match.
     * This allows the client app to handle these routes with client side routing.
     */
    fallback(): this;

    /**
     * Serves a custom HTML file as a fallback when no server routes match.
     * This file should contain a client app to handle these routes with client side routing.
     *
     * @param index - Path to the index `.html` file to serve.
     */
    fallback(index: string): this;

    global(name: string, fn: GlobalFunction): this;

    listen(port: number): Promise<AppInfo>;
  }

  interface AppInfo {
    port: number;
  }

  interface CORSConfig {
    allowOrigin?: string[];
    allowMethods?: Array<"GET" | "HEAD" | "PUT" | "PATCH" | "POST" | "DELETE">;
    allowHeaders?: string[];
    allowCredentials?: boolean;
    exposeHeaders?: string[];
    maxAge?: number;
  }

  /*=============================*\
  ||            Debug            ||
  \*=============================*/

  interface Debug {
    filter: string | RegExp;
    makeChannel(name: string): DebugChannel;
  }

  interface DebugChannel {
    name: string;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
  }

  /*=============================*\
  ||           Globals           ||
  \*=============================*/

  type ServiceFn = (this: ServiceContext, ctx: ServiceContext) => Object;

  interface ServiceContext {
    debug: DebugChannel;
    services: {
      [name: string]: any;
    };
    options: {
      [key: string]: any;
    };
  }

  /*=============================*\
  ||           Routing           ||
  \*=============================*/

  export function makeRouter(): Router;

  interface Router {
    use(middleware: RouteHandler): this;

    mount(router: Router): this;
    mount(path: string, router: Router): this;

    get(path: string, handler: RouteHandler): this;
    get(path: string, ...handlers: RouteHandler[]): this;

    post(path: string, handler: RouteHandler): this;
    post(path: string, ...handlers: RouteHandler[]): this;

    put(path: string, handler: RouteHandler): this;
    put(path: string, ...handlers: RouteHandler[]): this;

    patch(path: string, handler: RouteHandler): this;
    patch(path: string, ...handlers: RouteHandler[]): this;

    delete(path: string, handler: RouteHandler): this;
    delete(path: string, ...handlers: RouteHandler[]): this;

    options(path: string, handler: RouteHandler): this;
    options(path: string, ...handlers: RouteHandler[]): this;

    head(path: string, handler: RouteHandler): this;
    head(path: string, ...handlers: RouteHandler[]): this;
  }

  type RouteHandler = (ctx: RouteContext) => any;

  interface Request {}

  interface Response {}

  interface RouteContext {
    cache: {
      [key: string]: any;
    };
    global(name: string): any;
    request: Request;
    response: Response;
    redirect(to: string, statusCode?: number): void;
    next(): Function;

    eventSource(fn: (ctx: EventSourceContext) => void);
  }

  /*=============================*\
  ||      Server Sent Events     ||
  \*=============================*/

  /**
   * A server-side event source which emits events to a client through a persistent connection.
   * Commonly known as SSE (Server Sent Events).
   *
   * Return an EventSource from a request handler to establish this kind of connection.
   */
  export class EventSource {
    constructor(fn: EventSourceCallback);
    start(res: import("http").ServerResponse): void;
  }

  type EventSourceOptions = {
    /**
     * Number of milliseconds for client to wait before attempting to reconnect when the connection is lost.
     */
    retryTimeout?: number;
  };

  type EventSourceCallback = (connection: EventSourceContext) => void;

  class EventSourceContext {
    /**
     * Listen for events on this connection with a callback.
     */
    on(event: "close", callback: () => void): void;

    /**
     * Unregister a callback that is currently listening for events.
     */
    off(event: "close", callback: () => void): void;

    /**
     * Send raw data without an event.
     *
     * @param data - Any serializable object.
     */
    send(data: any): void;

    /**
     * Emit an event with a specific name. The client will listen for this with
     * `source.addEventListener("event")`.
     *
     * @param event - Event name.
     * @param data - Any serializable object.
     */
    emit(event: string, data: any): void;

    /**
     * Close the connection.
     */
    close(): void;
  }
}

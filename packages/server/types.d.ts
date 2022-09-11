declare module "@woofjs/server" {
  export function makeApp(): App;
  export function makeRouter(): Router;

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

  type RouteHandler = (this: RouteContext, ctx: RouteContext, next: NextFn) => any;

  interface Request {}

  interface Response {}

  interface RouteContext {
    cache: {
      [key: string]: any;
    };
    service(name: string): any;
    request: Request;
    response: Response;
    redirect(to: string, statusCode?: number): void;
  }

  /**
   * A server-side event source which emits events to a client through a persistent connection.
   * Commonly known as SSE (Server Sent Events).
   *
   * Return an EventSource from a request handler to establish this kind of connection.
   */
  export class EventSource {
    constructor(fn: EventSourceCallback, options: EventSourceOptions);
    start(res: import("http").ServerResponse): void;
  }

  type EventSourceOptions = {
    /**
     * Number of milliseconds for client to wait before attempting to reconnect when the connection is lost.
     */
    retryTimeout?: number;
  };

  type EventSourceCallback = (connection: EventSourceConnection) => void;

  class EventSourceConnection {
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

  interface Router {
    use(middleware: RouteHandler): this;

    mount(router: Router): this;
    mount(path: string, router: Router): this;

    get(url: string, ...handlers: RouteHandler[]): this;
    post(url: string, ...handlers: RouteHandler[]): this;
    put(url: string, ...handlers: RouteHandler[]): this;
    patch(url: string, ...handlers: RouteHandler[]): this;
    delete(url: string, ...handlers: RouteHandler[]): this;
    options(url: string, ...handlers: RouteHandler[]): this;
    head(url: string, ...handlers: RouteHandler[]): this;
  }

  interface AppInfo {
    port: number;
  }

  interface App extends Router {
    server: import("http").Server;
    service(name: string, service: ServiceFn): this;
    listen(port: number): Promise<AppInfo>;
  }
}

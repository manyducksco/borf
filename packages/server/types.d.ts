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

  interface RouteContext {
    cache: {
      [key: string]: any;
    };
    services: {
      [name: string]: any;
    };
    request: {};
    response: {};
    redirect(to: string, statusCode?: number): void;
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

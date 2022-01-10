declare module "@manyducksco/woof" {
  /*==================================*\
  ||               App                ||
  \*==================================*/

  interface AppOptions {
    /**
     * Options for @debug service.
     */
    debug?: {
      /**
       * Determines which debug channels are printed. Supports multiple filters with commas,
       * a prepended `-` to exclude a channel and wildcards to match partial channels.
       *
       * @example "service:*,-service:test" // matches everything starting with "service" except "service:test"
       */
      filter?: string | RegExp;

      /**
       * Print log messages when true. Default: true for development builds, false for production builds.
       */
      log?: boolean;

      /**
       * Print warn messages when true. Default: true for development builds, false for production builds.
       */
      warn?: boolean;

      /**
       * Print error messages when true. Default: true.
       */
      error?: boolean;
    };

    /**
     * Use hash-based routing.
     */
    hash?: boolean;
  }

  /**
   * Creates a new Woof app.
   *
   * @param options - Object with config options.
   */
  export function makeApp(options: AppOptions): App;

  /**
   *
   */
  export type App = {
    /**
     * Mounts a component at a route, so when the browser URL matches that path the component will be displayed.
     *
     * @param path - URL path (e.g. "/users/:id/edit")
     * @param component - A component to render for `path`
     */
    route(path: string, component: Component | ComponentFunction): this;

    /**
     * Registers a service on the app. Services can be referenced on
     * Services and Components using `this.service(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - Service class. One instance will be created and shared.
     * @param options - Object to be passed to service.created() function when called.
     */
    service(name: string, service: Service, options?: any): this;

    /**
     * Runs a function after services are created but before routes are connected.
     * Use this to configure services or set initial state.
     *
     * @param fn - Setup function.
     */
    setup(fn: SetupFunction): this;

    /**
     * Connects the app and starts routing. Routes are rendered as children of the `root` element.
     *
     * @param root - DOM node or a selector string.
     */
    connect(root: string | Node): Promise<void>;
  };

  type getService = (name: string) => Object;

  export type SetupFunction = (self: SetupSelf) => void | Promise<void>;

  export type SetupSelf = {
    getService: getService;
  };

  export type Component = {};

  export type ComponentSelf = {
    getService: getService;
  };

  export type ComponentFunction = ($: Dolla, self: ComponentSelf) => Element;

  export type Element = {};

  export type ServiceFunction = (self: ServiceSelf) => Object;

  export type ServiceSelf = {
    options: {
      [name: string]: any;
    };
    getService: getService;
  };

  /**
   * Creates a new app.
   *
   * @param options - Customize your app with an options object.
   */
  export default function (options?: AppOptions): App;

  /*==================================*\
  ||              Dolla               ||
  \*==================================*/

  export interface $Node {
    connect(): void;
    disconnect(): void;
  }

  export interface $Element extends $Node {}

  export type Dolla = {
    (): $Node;
    (tag: string, attributes?: any): $Node;
    (component: Component, attributes?: any): $Node;

    if(condition: State<any>, then: $Node | (() => $Node), otherwise?: $Node | (() => $Node)): $Node;
  };

  /*==================================*\
  ||               HTTP               ||
  \*==================================*/

  type HTTPRequestContext = {};

  type HTTPRequestOptions = {};

  class HTTPRequest {}

  type HTTPMiddleware = (ctx: HTTPRequestContext) => Promise<void>;

  export class HTTP {
    get(url: string, ...args: [...middleware: HTTPMiddleware[], options?: HTTPRequestOptions]): HTTPRequest;
  }

  /*==================================*\
  ||             Service              ||
  \*==================================*/

  /**
   * Singleton to store shared state and methods between components.
   */
  export class Service {
    app: AppInfo;
    http: HTTP;

    /**
     * Called when service is first created.
     */
    init(): void;
  }

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  /**
   * Testing.
   */
  export class Component {
    app: AppInfo;
    http: HTTP;

    /**
     * Creates an element.
     */
    createElement($: Dolla): $Element;
  }
}

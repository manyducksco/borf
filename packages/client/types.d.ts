/// <reference path="node_modules/@woofjs/state/types.d.ts" />

import type { State, makeState, mergeStates } from "@woofjs/state";

declare module "@woofjs/app" {
  /*==================================*\
  ||               App                ||
  \*==================================*/

  interface AppOptions {
    /**
     * Options for debug system.
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
   * Creates a new woof app.
   *
   * @param options - Configuration options.
   */
  export function makeApp(options: AppOptions): App;

  /**
   *
   */
  export type App = {
    /**
     * Registers a service on the app. Services can be referenced from
     * other Services and Components using `self.getService(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - Service class. One instance will be created and shared.
     * @param options - Object to be passed to service as `self.options`.
     */
    service(name: string, service: ServiceLike, options?: any): App;

    /**
     * Binds the URL to a set of components so the route determines which component you see.
     * Chooses the component with a matching path and displays it.
     *
     * @example
     * app.routes((when, redirect) => {
     *   when("/login", LoginComponent); // When the path is '/login', show LoginComponent
     *   when("/home", HomeComponent); // When the path is '/home', show HomeComponent
     *   redirect("*", "/home"); // When the path is anything else, go to '/home'
     * });
     *
     * @param defineRoutes - Function that defines the top level routes of your app.
     */
    routes(defineRoutes: DefineRoutesFn): App;

    /**
     * Runs a function after services are created but before routes are connected.
     * Use this to configure services or set initial state.
     *
     * @param fn - Setup function.
     */
    setup(fn: SetupFunction): App;

    /**
     * Connects the app and starts routing. Routes are rendered as children of the `root` element.
     *
     * @param root - DOM node or a selector string.
     */
    connect(root: string | Node): Promise<void>;
  };

  type Services = {
    "@debug": {};
    "@http": HTTPService;
    "@page": {};
    [name: string]: Service;
  };

  type getService = (name: keyof Services) => Services[keyof Services];

  type DebugChannel = {
    name: string;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
  };

  export type SetupFunction = (self: SetupSelf) => void | Promise<void>;

  export type SetupSelf = {
    getService: getService;
    debug: DebugChannel;
  };

  /*==================================*\
  ||             Routing              ||
  \*==================================*/

  type WhenFn = (path: string, component: ComponentLike, attributes = {}) => void;
  type RedirectFn = (path: string, to: string) => void;

  type DefineRoutesFn = (when: WhenFn, redirect: RedirectFn) => void;

  /*==================================*\
  ||              Dolla               ||
  \*==================================*/

  type DollaChild = string | number | ComponentInstance | null | false | undefined;

  export type Dolla = {
    (tag: string, attrs?: {}, ...children: DollaChild[]): ComponentInstance;
    (component: ComponentLike, attrs?: {}, ...children: DollaChild[]): ComponentInstance;

    if(
      $value: State<any>,
      then?: DollaChild | (() => DollaChild),
      otherwise?: DollaChild | (() => DollaChild)
    ): ComponentInstance;

    each<T>(
      $list: State<T>,
      makeKey: (current: T) => string | number,
      makeItem: (current: T) => ComponentInstance
    ): ComponentInstance;

    watch<T>($value: State<T>, makeItem: (current: T) => ComponentInstance | null): ComponentInstance;

    text($value, defaultValue): ComponentInstance;

    /**
     * Registers nested routes. Paths are relative to the current component's $route.href
     */
    routes(defineRoutes: DefineRoutesFn): ComponentInstance;

    bind<T>($state: State<T>, eventName = "input"): { isBinding: true; event: string; $state: State<T> };
  };

  /*==================================*\
  ||              State               ||
  \*==================================*/

  // TODO: Export makeState and mergeStates

  /*==================================*\
  ||               HTTP               ||
  \*==================================*/

  type HTTPRequestContext = {};

  type HTTPRequestOptions = {};

  class HTTPRequest {}

  type HTTPMiddleware = (ctx: HTTPRequestContext) => Promise<void>;

  export type HTTPService = {
    get(url: string): HTTPRequest;
    post(url: string): HTTPRequest;
    put(url: string): HTTPRequest;
    patch(url: string): HTTPRequest;
    delete(url: string): HTTPRequest;
  };

  /*==================================*\
  ||             Service              ||
  \*==================================*/

  export function makeService(fn: ServiceFunction): Service;

  /**
   * Stores shared variables and functions that can be accessed by components and other services.
   */
  export type Service = {};

  export type ServiceFunction = (self: ServiceSelf) => Object;

  export type ServiceSelf = {
    getService: getService;
    debug: DebugChannel;

    /**
     * Object with options passed to this service when it was registered.
     */
    options: {
      [name: string]: any;
    };

    beforeConnect: () => void;
    connected: () => void;
  };

  export type ServiceLike = Service | ServiceFunction;

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  export function makeComponent(fn: ComponentFunction): Component;

  export type Component = {
    readonly isComponent: true;
    (args: any): ComponentInstance;
  };

  export type ComponentInstance = {
    readonly isComponentInstance: true;
    routePreload(mount: (component: ComponentLike) => void): Promise<void>;
    connect(parent: Node, after?: Node): void;
    disconnect(): void;
  };

  export type ComponentSelf = {
    getService: getService;
    debug: DebugChannel;

    beforeConnect: () => void;
    connected: () => void;
    beforeDisconnect: () => void;
    disconnected: () => void;

    /**
     *
     */
    loadRoute: (show: (component: ComponentLike) => void, done: () => void) => Promise<any> | void;
  };

  export type ComponentFunction = ($: Dolla, self: ComponentSelf) => ComponentInstance | Node | null;

  export type ComponentLike = Component | ComponentFunction;
}

declare module "@woofjs/app/testing" {
  type TestTools = {};

  type Test = {
    (t: TestTools): void;
  };

  type View = {};

  type AddTestFunction = {
    (name: string, test: Test): void;

    beforeEach(fn: () => any): void;
    afterEach(fn: () => any): void;
    beforeAll(fn: () => any): void;
    afterAll(fn: () => any): void;
  };

  type AddViewFunction = {
    (name: string, view: View): void;
  };

  type SuiteFunction = (test: AddTestFunction, view: AddViewFunction) => void;

  type TestSuite = {
    run(): Promise<any>;
  };

  export function makeSuite(setup: SuiteFunction): TestSuite;
}

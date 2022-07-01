import type { History } from "history";

declare module "@woofjs/client" {
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

    router?: {
      /**
       * Use hash-based routing if true.
       */
      hash?: boolean;

      /**
       * A history object from the `history` package.
       *
       * @see https://www.npmjs.com/package/history
       */
      history?: History;
    };
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
    service(name: string, service: Service, options?: any): App;

    route(path: string, component: Component, defineRoutes?: DefineRoutesFn): App;

    redirect(path: string, to: string): App;

    /**
     * Runs a function after services are created but before routes are connected.
     * Use this to configure services or set initial state.
     *
     * @param fn - Setup function.
     */
    beforeConnect(fn: AppLifecycleCallback): App;
    afterConnect(fn: AppLifecycleCallback): App;

    /**
     * Connects the app and starts routing. Routes are rendered as children of the `root` element.
     *
     * @param root - DOM node or a selector string.
     */
    connect(root: string | Node): Promise<void>;
  };

  type DebugChannel = {
    name: string;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
  };

  export type AppLifecycleCallback = (self: AppSelf) => void | Promise<void>;

  export type AppSelf = {
    getService: <T = Object>(name: string) => T;
    debug: DebugChannel;
  };

  /*==================================*\
  ||             Routing              ||
  \*==================================*/

  type RouteHelpers = {
    route: (path: string, component: Component, defineRoutes?: DefineRoutesFn) => RouteHelpers;
    redirect: (path: string, to: string) => RouteHelpers;
  };

  type DefineRoutesFn = (helpers: RouteHelpers) => void;

  /*==================================*\
  ||            Templating            ||
  \*==================================*/

  type Element = Template | ToStringable | State<ToStringable>;
  type ElementFn = () => Element;

  type ToStringable = {
    toString(): string;
  };

  type AppContext = {
    getService: <T = Object>(name: string) => T;
  };

  type Template = {
    readonly isTemplate: true;
    init(app: AppContext): Component;
  };

  type BoundState<T> = {
    readonly isBinding: true;
    $value: State<T>;
    event: string;
  };

  export function v(tagname: string, attrs: Object, ...children: Template[]): Template;
  export function v(tagname: string, ...children: Template[]): Template;
  export function v(component: Component, attrs: Object, ...children: Template[]): Template;
  export function v(component: Component, ...children: Template[]): Template;

  export function when($condition: State, element: Element): Template;

  export function unless($condition: State, element: Element): Template;

  export function each<T>($values: State<T[]>, component: Component, getKey?: (value: T) => any): Template;

  export function watch<T>($value: State<T>, render: (value: T) => Element): Template;

  export function bind<T>($value: State<T>, event?: string): BoundState<T>;

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  export type Component<AttrsType> = ($attrs: State<AttrsType>, self: ComponentSelf) => Element | null;

  export type ComponentSelf = {
    getService: <T = Object>(name: string) => T;
    debug: DebugChannel;
    children: any;

    beforeConnect: () => void;
    afterConnect: () => void;
    beforeDisconnect: () => void;
    afterDisconnect: () => void;

    loadRoute: (show: (element: Element) => void, done: () => void) => Promise<any> | void;
  };

  /*==================================*\
  ||             Service              ||
  \*==================================*/

  /**
   * Stores shared variables and functions that can be accessed by components and other services.
   */
  export type Service = (self: ServiceSelf) => Object;

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
    afterConnect: () => void;
  };

  /*==================================*\
  ||              State               ||
  \*==================================*/

  type WatchOptions = {
    /**
     * Run the watcher function right away with the current value.
     */
    immediate: boolean;
  };

  type State<Type> = {
    /**
     * Returns the current value.
     */
    get(): Type;

    /**
     * Returns a nested property from the current value. Works with objects and arrays.
     *
     * @param selector - Property name (e.g. `some.value`, `names[3].first`, `length`)
     */
    get<V = unknown>(selector: string): V;

    /**
     * Returns a new value.
     *
     * @param newValue - Replacement value
     */
    set(newValue: Type): void;

    /**
     * Produces a new value using a function that can either mutate `current` or return a new value.
     * Mutations are applied on a cloned version of `current` that replaces the old one, immutably.
     */
    set(fn: (current: Type) => Type | void): void;

    watch(callback: (current: Type) => void): () => void;
    watch(callback: (current: Type) => void, options: WatchOptions): () => void;
    watch<V = unknown>(selector: string, callback: (selected: V) => void): () => void;
    watch<V = unknown>(selector: string, callback: (selected: V) => void, options: WatchOptions): () => void;

    map(): MapState<Type>;
    map<V = unknown>(selector: string): MapState<V>;
    map<V>(transform: (current: Type) => V): MapState<V>;
    map<V>(selector: string, transform: (selected: unknown) => V): MapState<V>;

    toString(): string;
  };

  /**
   * A read-only state derived from another state. Supports everything a regular State supports besides `.set()`.
   */
  type MapState<Type> = {
    [Property in keyof State<Type> as Exclude<Property, "set">]: State<Type>[Property];
  };

  /**
   * Creates a new state.
   *
   * @param initialValue - Optional starting value
   */
  export function makeState<T>(initialValue?: T): State<T>;

  /**
   * Takes multiple states followed by a function.
   * Each time any of the states' values change, the function is passed the values in the same order to return a new value.
   * Similar to `.map` but with several states being collapsed down to one.
   */
  export function mergeStates<T>(...args: any): State<any>;

  /**
   * Determines whether or not an object is a state.
   */
  export function isState(value: unknown): boolean;

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
}

declare module "@woofjs/client/testing" {
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

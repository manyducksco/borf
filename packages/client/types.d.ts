declare module "@woofjs/client" {
  import { Concat } from "typescript-tuple";

  /**
   * Creates a new woof app.
   *
   * @param options - Configuration options.
   */
  export function makeApp(options?: AppOptions): App;

  /*==================================*\
  ||               App                ||
  \*==================================*/

  interface AppOptions<ServicesType> {
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
      history?: import("history").History;
    };

    services?: ServicesType;
  }

  /**
   *
   */
  export class App<ServicesType> {
    constructor(options?: AppOptions<ServicesType>);

    readonly _services: {
      [Name in keyof ServicesType]: ServicesType[Name] extends Service<infer E> ? E : ReturnType<ServicesType[Name]>;
    };

    /**
     * Registers a service on the app. Services can be referenced from components and other services
     * in the `this.services` object.
     *
     * @param name - Unique string to name this service.
     * @param service - Service class. One instance will be created and shared.
     * @param options - Object to be passed to service as `self.options`.
     */
    service(name: string, service: ServiceFn, options?: any): this;

    /**
     * Registers a new route that will render `component` when `path` matches the current URL.
     * Register nested routes by passing a function as the third argument. Nested route components
     * will be rendered as this `component`'s children.
     *
     * @param path - Path to match.
     * @param component - Component to render when path matches URL.
     * @param defineRoutes - Optional function to define nested routes.
     */
    route(path: string, component: ComponentFn, defineRoutes?: DefineRoutesFn): this;

    /**
     * Register a route that will redirect to another when the `path` matches the current URL.
     *
     * @param path - Path to match.
     * @param to - Path to redirect location.
     */
    redirect(path: string, to: string): this;

    /**
     * Runs a function after services are created but before routes are connected.
     * Use this to configure services or set initial state.
     *
     * @param fn - Setup function.
     */
    beforeConnect(fn: AppLifecycleCallback): this;
    afterConnect(fn: AppLifecycleCallback): this;

    /**
     * Connects the app and starts routing. Routes are rendered as children of the `root` element.
     *
     * @param root - DOM node or a selector string.
     */
    connect(root: string | Node): Promise<void>;
  }

  type DebugChannel = {
    name: string;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
  };

  export type AppLifecycleCallback = (self: AppContext) => void | Promise<void>;

  type DefaultServices = {
    router: RouterService;
    http: HTTPService;
    page: PageService;
  };

  export type Services<Type> = DefaultServices & {
    [Name in keyof Type]: Type[Name];
  };

  // Extract the type of an app's services for use when defining components.
  export type ServicesOf<App> = DefaultServices & {
    [Name in keyof App["_services"]]: App["_services"][Name];
  };

  export type AppContext<ServicesType> = {
    services: Services<ServicesType>;
    debug: DebugChannel;
  };

  export type RouterService = {
    $route: State<string>;
    $path: State<string>;
    $params: State<{ [name: string]: unknown }>;
    $query: State<{ [name: string]: unknown }>;

    back: (steps?: number) => void;
    forward: (steps?: number) => void;
    navigate: (path: string, options?: { replace?: boolean }) => void;
  };

  export type PageService = {
    $title: State<string>;
  };

  /*==================================*\
  ||               HTTP               ||
  \*==================================*/

  export type HTTPService = {
    use(middleware: HTTPMiddleware): this;
    get(url: string): HTTPRequest;
    post(url: string): HTTPRequest;
    put(url: string): HTTPRequest;
    patch(url: string): HTTPRequest;
    delete(url: string): HTTPRequest;
  };

  type HTTPRequestContext = {};

  type HTTPRequestOptions = {};

  interface HTTPRequest {}

  type HTTPMiddleware = (ctx: HTTPRequestContext, next: () => Promise<void>) => Promise<void>;

  /*==================================*\
  ||             Routing              ||
  \*==================================*/

  type RouteHelpers = {
    route: (path: string, component: ComponentFn, defineRoutes?: DefineRoutesFn) => RouteHelpers;
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

  type Template = {
    readonly isTemplate: true;
    init(appContext: AppContext): ComponentFn;
  };

  type BoundState<T> = {
    readonly isBinding: true;
    $value: State<T>;
    event: string;
  };

  export function h(element: string | ComponentFn, attrs: Object, ...children: Template[]): Template;
  export function h(element: string | ComponentFn, ...children: Template[]): Template;

  export function when($condition: State, element: Element): Template;

  export function unless($condition: State, element: Element): Template;

  export function repeat<T>($values: State<T[]>, component: ComponentFn, getKey?: (value: T) => any): Template;

  export function watch<T>($value: State<T>, render: (value: T) => Element): Template;

  export function bind<T>($value: State<T>, event?: string): BoundState<T>;

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  // A convenient fiction for TypeScript's JSX checker. This does not actually resemble how components are implemented,
  // but it does resemble a factory function that returns a JSX element, which is a form that TS understands.
  export type WoofElement<AttrsType> = (attrs: AttrsType) => { init: ComponentFn<AttrsType> };

  export type Component<AttrsType, ServicesType> = {
    new <AttrsType = any, ServicesType = any>(fn: ComponentFn<AttrsType, ServicesType>): WoofElement<AttrsType>;

    new <AttrsType = any, infer>(
      app: App<ServicesType>,
      fn: ComponentFn<AttrsType, ServicesOf<App<ServicesType>>>
    ): WoofElement<AttrsType>;

    new <AttrsType = any, ServicesType = any>(
      app: App<ServicesType>,
      fn: ComponentFn<AttrsType, ServicesOf<App<ServicesType>>>
    ): WoofElement<AttrsType>;
  };
  export const Component: Component<AttrsType, ServicesType> = function () {};

  export type ComponentFn<AttrsType, ServicesType> = (
    this: ComponentContext<AttrsType, ServicesType>,
    self: ComponentContext<AttrsType, ServicesType>
  ) => Element | null;

  export interface ComponentContext<AttrsType = any, ServicesType = any> {
    $attrs: State<AttrsType>;
    services: Services<ServicesType>;
    debug: DebugChannel;
    children: any;

    beforeConnect(callback: () => void): void;
    afterConnect(callback: () => void): void;
    beforeDisconnect(callback: () => void): void;
    afterDisconnect(callback: () => void): void;
    transitionOut(callback: () => Promise<void>): void;

    subscribeTo<Type>(observable: Observable<Type>, observer: Observer<Type>): void;
    subscribeTo<Type>(
      observable: Observable<Type>,
      next?: (value: Type) => void,
      error?: (err: Error) => void,
      complete?: () => void
    ): void;

    loadRoute: (show: (element: Element) => void, done: () => void) => Promise<any> | void;
  }

  /*==================================*\
  ||             Service              ||
  \*==================================*/

  /**
   * Stores shared variables and functions that can be accessed by components and other services.
   */
  export type ServiceFn<ExportsType> = (this: ServiceContext, ctx: ServiceContext) => ExportsType;

  export type ServiceContext = {
    services: Services<any>; // Non-default services can't be typed on other services.
    debug: DebugChannel;

    beforeConnect: () => void;
    afterConnect: () => void;
  };

  class Service<ExportsType> implements ServiceContext {
    services: Services<any>;
    debug: DebugChannel;

    constructor(fn?: ServiceFn<ExportsType>);

    init(): ExportsType;

    beforeConnect: () => void;
    afterConnect: () => void;
  }

  /*==================================*\
  ||              State               ||
  \*==================================*/

  interface Observer<Type> {
    next(value: Type): void;
  }

  interface Observable<Type> {
    subscribe(observer: Observer<Type>): Subscription;
    subscribe(next: (value: Type) => void): Subscription;
  }

  interface Subscription {
    unsubscribe(): void;
  }

  export class State<Type> implements Observable<Type> {
    /**
     * Takes one or more states to merge.
     */
    static merge<ArgsType extends State<any>[]>(...args: ArgsType): MergeState<ArgsType>;

    constructor(initialValue: Type);

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
     * Passes the current value to a mapping function and returns the result of that function.
     *
     * @param fn - Function to map the current value to the one you want to get.
     */
    get<V = unknown>(fn: (current: Type) => V): V;

    /**
     * Replaces the state's value with `newValue`.
     *
     * @param newValue - New value.
     */
    set(newValue: Type): void;

    /**
     * Produces a new value using a function that can either mutate `current` or return a new value.
     * Mutations are applied on a cloned version of `current` that replaces the old one.
     */
    set(fn: (current: Type) => Type | void): void;

    subscribe(observer: Observer<Type>): Subscription;
    subscribe(next: (value: Type) => void): Subscription;

    map(): ReadOnlyState<Type>;
    map<V = unknown>(selector: string): ReadOnlyState<V>;
    map<V>(transform: (current: Type) => V): ReadOnlyState<V>;

    toString(): string;
  }

  // Infers the type of the value of a state.
  type StateType<S> = S extends State<infer T> ? T : null;

  // Extract an array of T for an array of State<T>
  type StateValues<ArgsType extends State<any>[]> = {
    [Index in keyof ArgsType]: StateType<ArgsType[Index]>;
  } & ArgsType["length"];

  /**
   * An intermediate state with a list of states to merge.
   * Not particularly useful on its own, but takes a merge function
   * through the `.into(fn)` method. This function takes the states' values
   * in the same order they were passed, returning the new value of the resulting state.
   */
  class MergeState<ArgsType> {
    /**
     * Asdf
     */
    into<MergedType>(fn: (...values: StateValues<ArgsType>) => MergedType): ReadOnlyState<MergedType>;

    with<MoreArgsType extends State<any>[]>(...states: MoreArgsType): MergeState<Concat<ArgsType, MoreArgsType>>;
  }

  /**
   * A read-only state derived from another state. Supports everything a regular State supports besides `.set()`.
   */
  type ReadOnlyState<Type> = {
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
}

// TODO: Define all elements and the attributes they support.
declare namespace JSX {
  interface IntrinsicElements {
    // div: { id?: string };
    [elemName: string]: any;
  }

  interface ElementClass {
    init: any;
  }
}

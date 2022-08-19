declare module "@woofjs/client" {
  import type { Concat } from "typescript-tuple";
  import type { History } from "history";

  /**
   * Creates a new woof app.
   *
   * @param options - Configuration options.
   */
  export function makeApp<ServicesType>(options?: AppOptions<ServicesType>): App<ServicesType>;

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

    /**
     * Options to configure how routing works.
     */
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

    /**
     *
     */
    services?: ServicesType;
  }

  /**
   * An app is the central object of a Woof app. It handles mounting and unmounting of routes
   * based on the current URL and providing services to components rendered under those routes.
   */
  interface App<ServicesType> {
    readonly _services: ServicesType;

    /**
     * Registers a new route that will render `component` when `path` matches the current URL.
     * Register nested routes by passing a function as the third argument. Nested route components
     * will be rendered as this `component`'s children.
     *
     * @param path - Path to match.
     * @param component - Component to render when path matches URL.
     * @param defineRoutes - Optional function to define nested routes.
     */
    route(path: string, component: ComponentFn<{}, UnwrapServices<ServicesType>>, defineRoutes?: DefineRoutesFn): this;

    /**
     * Register a route that will redirect to another when the `path` matches the current URL.
     *
     * @param path - Path to match.
     * @param to - Path to redirect location.
     */
    redirect(path: string, to: string): this;

    /**
     * Runs a callback function after services are created but before any components have been connected.
     *
     * @param callback - Setup function.
     */
    beforeConnect(callback: AppLifecycleCallback<ServicesType>): this;

    /**
     * Runs a callback function just after the initial route is connected.
     *
     * @param callback - Setup function.
     */
    afterConnect(callback: AppLifecycleCallback<ServicesType>): this;

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

  export type AppContext<ServicesType> = {
    services: Services<ServicesType>;
    debug: DebugChannel;
  };

  export type AppLifecycleCallback<ServicesType> = (
    this: AppContext<ServicesType>,
    self: AppContext<ServicesType>
  ) => void | Promise<void>;

  export type DefaultServices = {
    router: RouterService;
    http: HTTPService;
    page: PageService;
  };

  export type Services<Type> = DefaultServices & UnwrapServices<Type>;

  // Extract the type of an app's services for use when defining components.
  export type ServicesOf<T> = T extends App<infer S> ? DefaultServices & UnwrapServices<S> : DefaultServices;

  export type UnwrapServices<T> = {
    [Name in keyof T]: T[Name] extends Service<infer U>
      ? U
      : T[Name] extends (...args: any) => any
      ? ReturnType<T[Name]>
      : T[Name];
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
  ||            Observable            ||
  \*==================================*/

  interface Observable<Type> {
    subscribe(observer: Observer<Type>): Subscription;
    subscribe(next: (value: Type) => void): Subscription;
  }

  interface Observer<Type> {
    next(value: Type): void;
  }

  interface Subscription {
    unsubscribe(): void;
  }

  /*==================================*\
  ||               HTTP               ||
  \*==================================*/

  export interface HTTPService {
    /**
     * Add middleware to the HTTP service for all requests.
     * Middleware can intercept outgoing requests and modify incoming responses.
     *
     * @param middleware - Async middleware function.
     */
    use(middleware: HTTPMiddleware): this;

    /**
     * Make an HTTP request to `url` with any `method`.
     *
     * @param method - HTTP method.
     * @param url - Request endpoint.
     */
    request<T>(method: string, url: string): HTTPRequest<T>;

    /**
     * Make an HTTP `GET` request to `url`.
     *
     * @param url - Request endpoint.
     */
    get<T = any>(url: string): HTTPRequest<T>;

    /**
     * Make an HTTP `PUT` request to `url`.
     *
     * @param url - Request endpoint.
     */
    put<T = any>(url: string): HTTPRequest<T>;

    /**
     * Make an HTTP `PATCH` request to `url`.
     *
     * @param url - Request endpoint.
     */
    patch<T = any>(url: string): HTTPRequest<T>;

    /**
     * Make an HTTP `POST` request to `url`.
     *
     * @param url - Request endpoint.
     */
    post<T = any>(url: string): HTTPRequest<T>;

    /**
     * Make an HTTP `DELETE` request to `url`.
     *
     * @param url - Request endpoint.
     */
    delete<T = any>(url: string): HTTPRequest<T>;

    /**
     * Make an HTTP `HEAD` request to `url`.
     *
     * @param url - Request endpoint.
     */
    head(url: string): HTTPRequest<void>;
  }

  type HTTPRequestContext = {
    method: string;
    headers: Headers;
    body: any;
  };

  type HTTPRequestOptions = {};

  type HTTPResponse<BodyType> = {
    status: number;
    statusText: string;
    headers: {
      [name: string]: string;
    };
    body: BodyType;
  };

  type HTTPMiddleware = (ctx: HTTPRequestContext, next: () => Promise<void>) => Promise<void>;

  interface HTTPRequest<T> extends Promise<HTTPResponse<T>> {
    /**
     * True if this request is to a URL relative to the current page.
     */
    readonly isRelative: boolean;

    /**
     * Gets the current request URL.
     */
    url(): string;

    /**
     * Sets the request URL.
     */
    url(value: string): void;

    /**
     * Gets the current header value by name.
     */
    header(name: string): string | undefined;

    /**
     * Sets a header value.
     */
    header(name: string, value: string): this;

    /**
     * Sets multiple headers at once using an object.
     * Merges values with existing headers.
     */
    header(headers: { [name: string]: string }): this;

    /**
     * Gets the current header value by name.
     */
    headers(name: string): string | undefined;

    /**
     * Sets a header value.
     */
    headers(name: string, value: ToStringable): this;

    /**
     * Sets multiple headers at once using an object.
     * New values are merged with existing headers.
     */
    headers(headers: { [name: string]: ToStringable }): this;

    /**
     * Gets the value of the named query param.
     */
    query(name: string): string | undefined;

    /**
     * Sets the value of the named query param.
     */
    query(name: string, value: ToStringable): this;

    /**
     * Sets multiple query params at once using an object.
     * New values are merged with existing params.
     */
    query(params: { [name: string]: ToStringable }): this;

    /**
     * Sets the request body to `value`.
     */
    body(value: any): this;

    /**
     * Defines a check for whether the response code indicates an error or success.
     * If this function returns false for a status code, it will be thrown as an error.
     */
    ok(check: (status: number) => boolean): this;

    /**
     * Returns the response object (if there is one).
     */
    response(): HTTPResponse<T> | undefined;
  }

  /*==================================*\
  ||             Routing              ||
  \*==================================*/

  type RouteHelpers = {
    route: (path: string, component: ComponentFn<any, any>, defineRoutes?: DefineRoutesFn) => RouteHelpers;
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
    init(appContext: AppContext<any>): ComponentFn<any, any>;
  };

  type StateBinding<T> = {
    readonly isBinding: true;
    $value: MutableState<T>;
    event: string;
  };

  export function h(
    element: string | Component<any> | ComponentFn<any, any>,
    attrs: Object,
    ...children: Template[]
  ): Template;
  export function h(element: string | Component<any> | ComponentFn<any, any>, ...children: Template[]): Template;

  export function watch<T>(value: Observable<T>, render: (value: T) => Element): Template;

  export function when(condition: Observable<any>, element: Element): Template;

  export function unless(condition: Observable<any>, element: Element): Template;

  export function repeat<T>(
    values: Observable<T[]>,
    component: Component<any> | ComponentFn<any, any>,
    getKey?: (value: T) => any
  ): Template;

  export function bind<T>(value: MutableState<T>, event?: string): StateBinding<T>;

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  export function makeComponent<AttrsType, ServicesType>(
    fn: ComponentFn<AttrsType, ServicesType>
  ): Component<AttrsType>;

  /**
   * Creates a component, passing in the reference to the app to infer services.
   * This signature is designed to be used in plain JS to get service autocomplete.
   */
  export function makeComponent<ServicesType>(
    app: App<ServicesType>,
    fn: ComponentFn<any, ServicesType>
  ): Component<any>;

  // A convenient fiction for TypeScript's JSX checker. This does not actually resemble how components are implemented,
  // but it does resemble a factory function that returns a JSX element, which is a form that TS understands.
  export type Component<AttrsType> = (attrs: ComponentAttrs<AttrsType>) => { init: ComponentFn<AttrsType, any> };

  /**
   * Components can take observables of the same type as attributes for any value.
   */
  export type ComponentAttrs<AttrsType> = {
    [Name in keyof AttrsType]: AttrsType[Name] extends Observable<any>
      ? AttrsType[Name]
      : AttrsType[Name] | Observable<AttrsType[Name]>;
  };

  export type ComponentFn<AttrsType, ServicesType> = (
    this: ComponentContext<AttrsType, ServicesType>,
    self: ComponentContext<AttrsType, ServicesType>
  ) => Element | null;

  export interface ComponentContext<AttrsType = any, ServicesType = any> {
    /**
     * Attributes passed into to this component.
     *
     * @example
     * <User name="Bob" age={42} />
     *
     * // Inside the component ctx.$attrs.get() returns:
     * {
     *   name: "Bob",
     *   age: 42
     * }
     */
    $attrs: State<AttrsType>;

    /**
     * An object containing services registered on the app.
     */
    services: Services<ServicesType>;

    /**
     * A debug channel unique to this component. It has log, warn and error methods like `console`,
     * but you can also set a prefix by changing `debug.name`.
     *
     * Useful for logging info that you want to hide in production without
     * deleting all your `console.log`s. Just change the filter in the `makeApp` options object
     * to specify only what you want to see.
     */
    debug: DebugChannel;

    /**
     * Other elements passed between the opening and closing tags of this component.
     *
     * @example
     * ```jsx
     * <Container>
     *   <h1>These are children.</h1>
     *   <p>Use `ctx.children` in this component's template to render these elements.</p>
     *   <OtherComponent />
     * </Container>
     * ```
     */
    children: any;

    /**
     * Registers a callback to run before the component is connected to the DOM.
     */
    beforeConnect(callback: () => void): void;

    /**
     * Registers a callback to run after the component is connected to the DOM.
     */
    afterConnect(callback: () => void): void;

    /**
     * Registers a callback to run before the component is removed from the DOM.
     */
    beforeDisconnect(callback: () => void): void;

    /**
     * Registers a callback to run after the component is removed from the DOM.
     */
    afterDisconnect(callback: () => void): void;

    /**
     * Subscribes to an observable while this component is connected.
     *
     * @param observable - An Observable object compatible with the TC39 Observables spec. This can be a `State` from `@woofjs/client` or an observable from another library like RxJS.
     * @param observer - An observer object with `next`, `error` and `complete` methods.
     *
     * @see https://github.com/tc39/proposal-observable
     */
    subscribeTo<Type>(observable: Observable<Type>, observer: Observer<Type>): void;

    /**
     * Subscribes to an observable while this component is connected.
     *
     * @param observable - An Observable object compatible with the TC39 Observables spec. This can be a `State` from `@woofjs/client` or an observable from another library like RxJS.
     * @param next - Callback to receive `next` values from the observable.
     * @param error - Callback to receive `error` values from the observable.
     * @param complete - Callback to receive the `complete` signal from the observable.
     *
     * @see https://github.com/tc39/proposal-observable
     */
    subscribeTo<Type>(
      observable: Observable<Type>,
      next?: (value: Type) => void,
      error?: (err: Error) => void,
      complete?: () => void
    ): void;

    transitionOut(callback: () => Promise<void>): void;
    loadRoute: (show: (element: Element) => void, done: () => void) => Promise<any> | void;
  }

  /*==================================*\
  ||             Service              ||
  \*==================================*/

  export function makeService<ExportsType>(fn: ServiceFn<ExportsType>): Service<ExportsType>;

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

  export type Service<ExportsType> = {
    exports: ExportsType;
    init(): void;
    beforeConnect: () => void;
    afterConnect: () => void;
  };

  /*==================================*\
  ||              State               ||
  \*==================================*/

  export function makeState<Type>(initialValue?: Type): MutableState<Type>;

  interface State<Type> {
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
     * @param transform - Function to map the current value to the one you want to get.
     */
    get<V>(transform: (current: Type) => V): V;

    subscribe(observer: Observer<Type>): Subscription;
    subscribe(next: (value: Type) => void): Subscription;

    map(): State<Type>;
    map<V>(transform: (current: Type) => V): State<V>;

    toString(): string;
  }

  /**
   * A state that can be updated using a `.set()` method.
   * This is the type of state you get from calling `makeState()`.
   */
  interface MutableState<Type> extends State<Type> {
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
  }

  // Infers the type of the value of a state.
  type UnwrapState<T> = T extends State<infer V> ? V : T;

  // Extract an array of T for an array of State<T>
  type StateValues<ArgsType extends State<any>[]> = {
    [Index in keyof ArgsType]: UnwrapState<ArgsType[Index]>;
  } & ArgsType["length"];

  /**
   * Takes multiple states followed by a function.
   * Each time any of the states' values change, the function is passed the values in the same order to return a new value.
   * Similar to `.map` but with several states being collapsed down to one.
   */
  // TODO: Get types right. Arrays passed in are not being interpreted as tuples.
  export function mergeStates<T extends [...State<any>[]], R>(
    merge: (values: StateValues<T>) => R,
    ...states: T
  ): State<R>;

  export function mergeStates<States extends [...State<any>[]]>(...states: States): StateMerge<States>;

  interface StateMerge<States extends [...State<any>[]]> {
    with<MoreStates extends [...State<any>[]]>(...states: MoreStates): StateMerge<Concat<States, MoreStates>>;

    into<Result>(merge: (...values: StateValues<States>) => Result): State<Result>;
  }

  /**
   * Determines whether or not an object is a state.
   */
  export function isState(value: unknown): boolean;
}

declare module "@woofjs/client/jsx-runtime" {
  import type { Template, Component, ComponentFn } from "@woofjs/client";

  export function jsx(
    element: string | Component<any> | ComponentFn<any, any>,
    props: { [name: string]: any; children: Template },
    key: any
  ): Template;

  export function jsxs(
    element: string | Component<any> | ComponentFn<any, any>,
    props: { [name: string]: any; children: Template[] },
    key: any
  ): Template;
}

declare module "@woofjs/client/jsx-dev-runtime" {
  import type { Template } from "@woofjs/client";

  export function jsxDEV(
    element: string | Component<any> | ComponentFn<any, any>,
    props: { [name: string]: any; children: Template | Template[] },
    key: any,
    isStaticChildren: boolean,
    source: any,
    self: any
  ): Template;
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

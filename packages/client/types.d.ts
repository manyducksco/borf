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

  export type AppLifecycleCallback<ServicesType> = (ctx: AppContext<ServicesType>) => void | Promise<void>;

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
    $query: MutableState<{ [name: string]: unknown }>;

    back: (steps?: number) => void;
    forward: (steps?: number) => void;
    navigate: (path: string, options?: { replace?: boolean }) => void;
  };

  export type PageService = {
    $title: MutableState<string>;
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

  type HTTPMiddleware = <T>(req: HTTPRequest<T>, next: () => Promise<void>) => Promise<void>;

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
     * Sets the value of the header with name `name` to `value`.
     * If `value` is null the header is removed.
     */
    header(name: string, value: ToStringable | null): this;

    /**
     * Clears the value of the header with name `name`.
     */
    header(name: string, value: null): this;

    /**
     * Sets multiple headers at once using an object.
     * Merges values with existing headers.
     */
    header(headers: { [name: string]: string }): this;

    /**
     * Returns the current value of the header with name `name`.
     */
    headers(name: string): string | undefined;

    /**
     * Sets the value of the header with name `name` to `value`.
     * If `value` is null the header is removed.
     */
    headers(name: string, value: ToStringable | null): this;

    /**
     * Sets multiple headers at once using an object.
     * New values are merged with existing headers.
     */
    headers(headers: { [name: string]: ToStringable | null }): this;

    /**
     * Returns the value of the query param with name `name`.
     */
    query(name: string): string | undefined;

    /**
     * Sets the value of the query param with name `name` to `value`.
     * If `value` is null the query param is removed.
     */
    query(name: string, value: ToStringable | null): this;

    /**
     * Sets multiple query params at once using an object.
     * New values are merged with existing params.
     */
    query(params: { [name: string]: ToStringable | null }): this;

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

  /**
   * Displays the result of `render` each time `value` changes.
   */
  export function watch<T>(value: Observable<T>, render: (value: T) => Element): Template;

  /**
   * Displays `element` when `condition` is truthy.
   */
  export function when(condition: Observable<any>, element: Element): Template;

  /**
   * Displays `element` when `condition` is falsy.
   */
  export function unless(condition: Observable<any>, element: Element): Template;

  /**
   * Repeats a component for each item in `values`.
   */
  export function repeat<T>(
    values: T[] | Observable<T[]>,
    component: ComponentFn<any, { index: number; value: T }>,
    getKey?: (value: T) => any
  ): Template;

  // export function repeat<T>(
  //   values: T[] | Observable<T[]>,
  //   component: Component<RepeatAttrs<T>>,
  //   getKey?: (value: T) => any
  // ): Template;

  export function bind<T>(value: MutableState<T>, event?: string): StateBinding<T>;

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  type DefaultServicesType = any;
  type DefaultAttrsType = {};
  type DefaultChildrenType = void;

  // Takes types in order of <Services, Attrs, Children> because all components are going to want services
  // defined because most will use them. Some components don't take attrs and many might not take children.
  // This order makes it possible to leave off the less commonly used types.
  export function makeComponent<
    ServicesType = DefaultServicesType,
    AttrsType = DefaultAttrsType,
    ChildrenType = DefaultChildrenType
  >(fn: ComponentFn<ServicesType, AttrsType, ChildrenType>): Component<ObservableAttrs<AttrsType>, ChildrenType>;

  export type ComponentFn<
    ServicesType = DefaultServicesType,
    AttrsType = DefaultAttrsType,
    ChildrenType = DefaultChildrenType
  > = (ctx: ComponentContext<ServicesType, UnwrappedAttrs<AttrsType>, ChildrenType>) => Element | null;

  // A convenient fiction for TypeScript's JSX checker. This does not actually resemble how components are implemented,
  // but it does resemble a factory function that returns a JSX element, which is a form that TS understands.
  export type Component<AttrsType, ChildrenType> = (attrs: AttrsType) => {
    init: ComponentFn<any, AttrsType>;
  };

  /**
   * Components can take observables of the same type as attributes for any value.
   * This utility unwraps the values in the observables to their value type.
   *
   * Attrs beginning with `$` are not unwrapped as these must be MutableStates according to Woof component logic.
   */
  export type UnwrappedAttrs<AttrsType> = {
    [Name in keyof AttrsType]: Name extends `$${infer T}`
      ? AttrsType[Name]
      : AttrsType[Name] extends Observable<infer Type>
      ? Type
      : AttrsType[Name];
  };

  /**
   * Allows attributes that aren't Observable type to be passed as an observable or the raw value.
   * Components unwrap observable attributes into their raw values by the time they're accessed.
   */
  export type ObservableAttrs<AttrsType> = {
    [Name in keyof AttrsType]: AttrsType[Name] extends Observable<any>
      ? AttrsType[Name]
      : AttrsType[Name] | Observable<AttrsType[Name]>;
  };

  export interface ComponentContext<
    ServicesType = DefaultServicesType,
    AttrsType = DefaultAttrsType,
    ChildrenType = DefaultChildrenType
  > {
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
     * A unique debug channel for this component. Has `log`, `warn` and `error` methods like `console`.
     * You can also set a prefix by changing `debug.name`.
     *
     * Messages printed to a debug channel can be filtered based on settings passed to your app.
     * This is a good alternative to `console.log` because you can simply filter messages out in production
     * instead of removing all your `console.log` calls.
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
    children: ChildrenType;

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
    loadRoute: (callbackFn: (helpers: { show: (element: Element) => void }) => Promise<void>) => void;
  }

  /*==================================*\
  ||             Service              ||
  \*==================================*/

  /**
   * Creates a blueprint for a service.
   *
   * Services are containers for state and shared methods, attached to an app and accessible from all components
   * rendered by that app. Only a single instance of each service is created, making them a great place to store state
   * that needs to be shared among multiple components.
   *
   * @param fn - Service definition function. Returns an object that will be accessible to components accessing the service.
   */
  export function makeService<ExportsType>(fn: ServiceFn<ExportsType>): Service<ExportsType>;

  /**
   * Stores shared variables and functions that can be accessed by components and other services.
   */
  export type ServiceFn<ExportsType> = (ctx: ServiceContext) => ExportsType;

  export type ServiceContext = {
    /**
     * An object containing services registered on the app.
     */
    services: Services<any>; // Non-default services can't be typed on other services.

    /**
     * A unique debug channel for this component. Has `log`, `warn` and `error` methods like `console`.
     * You can also set a prefix by changing `debug.name`.
     *
     * Messages printed to a debug channel can be filtered based on settings passed to your app.
     * This is a good alternative to `console.log` because you can simply filter messages out in production
     * instead of removing all your `console.log` calls.
     */
    debug: DebugChannel;

    /**
     * Registers a callback to run before the app is connected.
     */
    beforeConnect: (callback: () => void) => void;

    /**
     * Registers a callback to run after the app is connected and the first route match has taken place.
     */
    afterConnect: (callback: () => void) => void;

    /**
     * Subscribes to an observable while this service is connected.
     *
     * @param observable - An Observable object compatible with the TC39 Observables spec. This can be a `State` from `@woofjs/client` or an observable from another library like RxJS.
     * @param observer - An observer object with `next`, `error` and `complete` methods.
     *
     * @see https://github.com/tc39/proposal-observable
     */
    subscribeTo<Type>(observable: Observable<Type>, observer: Observer<Type>): void;

    /**
     * Subscribes to an observable while this service is connected.
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
     * Passes the current value to a mapping function and returns the result of that function.
     *
     * @param callbackFn - Function to map the current value to the value you want.
     */
    get<V>(callbackFn: (current: Type) => V): V;

    /**
     * Returns a read only copy of this state.
     */
    map(): State<Type>;

    /**
     * Returns a new state that takes the return value of `callbackFn` when called with the value of this state.
     *
     * @param callbackFn - Function to map the current state's value to the new state's value.
     */
    map<V>(callbackFn: (current: Type) => V): State<V>;

    subscribe(observer: Observer<Type>): Subscription;
    subscribe(next: (value: Type) => void): Subscription;
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
     * Produces a new value using a function. Can either mutate `current` or return a new value.
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
   * Takes multiple states to merge into one through a function.
   * Each time any of the states' values change, the function receives all state values in the same order to calculate a new value.
   * Similar to `.map` but with several states being collapsed down to one.
   */
  export function mergeStates<States extends [...State<any>[]]>(...states: States): MergeState<States>;

  /**
   * A new state that holds an array of values of the states passed to `mergeStates`. Can be refined further with methods.
   */
  interface MergeState<States extends [...State<any>[]]> extends State<StateValues<States>> {
    /**
     * Create a new merge with all existing states plus any new states passed to `with`.
     */
    with<MoreStates extends [...State<any>[]]>(...states: MoreStates): MergeState<Concat<States, MoreStates>>;

    /**
     * Takes a merge function. Each time any of the states in this merge receive a new value, this function is called with the values of
     * all the merged states in the order they were passed. Whatever this function returns becomes the new value of a derived state.
     */
    into<Result>(merge: (...values: StateValues<States>) => Result): State<Result>;
  }

  /**
   * Determines whether or not an object is a state.
   */
  export function isState(value: unknown): boolean is State<unknown>;
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
  import type { Template, Component, ComponentFn } from "@woofjs/client";

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

declare module "@woofjs/client" {
  import type { Concat } from "typescript-tuple";
  import type { History } from "history";

  /**
   * Creates a new woof app.
   *
   * @param options - Configuration options.
   */
  export function makeApp<AppServices = any>(options?: AppOptions): App<AppServices>;

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
  }

  /**
   * An app is the central object of a Woof app. It handles mounting and unmounting of routes
   * based on the current URL and providing services to components rendered under those routes.
   */
  interface App<ServicesType> {
    /**
     * Registers a service on this app. Services have only one instance created per app.
     * Any component rendered under one of this app's routes, as well as any other services
     * registered on this app will be able to access this new service.
     *
     * @param name - Name the service is accessed by.
     * @param service - The service. Can be a service from `makeService`, a function or a plain object.
     */
    service<Name extends keyof ServicesType>(name: Name, service: ServicesType[Name]): this;

    /**
     * Registers a new route that will render `component` when `path` matches the current URL.
     * Register nested routes by passing a function as the third argument. Nested route components
     * will be rendered as this `component`'s children.
     *
     * @param path - Path to match.
     * @param component - Component to render when path matches URL.
     * @param defineRoutes - Optional function to define nested routes.
     */
    // TODO: Infer child type by defineRoutes
    route(path: string, component: ComponentLike<{}, any>, defineRoutes?: DefineRoutesFn): this;

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
    router: ExportsOf<RouterService>;
    http: ExportsOf<HTTPService>;
    page: ExportsOf<PageService>;
  };

  export type Services<T> = DefaultServices & { [K in keyof T]: ExportsOf<T[K]> };

  // export type ServicesOf<A> = A extends App<infer U> ? Services<U> : unknown;

  /**
   * Unwraps a service, service function or service object into its exports type.
   */
  export type ExportsOf<T> = T extends ServiceLike<infer U> ? U : T extends (...args: any) => any ? ReturnType<T> : T;

  export type UnwrapServices<T> = {
    [Name in keyof T]: ExportsOf<T[Name]>;
  };

  export type RouterService = Service<{
    $route: State<string>;
    $path: State<string>;
    $params: State<{ [name: string]: unknown }>;
    $query: MutableState<{ [name: string]: unknown }>;

    back: (steps?: number) => void;
    forward: (steps?: number) => void;
    navigate: (path: string, options?: { replace?: boolean }) => void;
  }>;

  export type PageService = Service<{
    $title: MutableState<string>;
  }>;

  /*==================================*\
  ||            Observable            ||
  \*==================================*/

  interface Observable<T> {
    subscribe(observer: Observer<T>): Subscription;
    subscribe(next: (value: T) => void): Subscription;
  }

  interface Observer<T> {
    next(value: T): void;
  }

  interface Subscription {
    unsubscribe(): void;
  }

  /*==================================*\
  ||               HTTP               ||
  \*==================================*/

  export type HTTPService = Service<{
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
  }>;

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
    route: (path: string, component: ComponentLike<any, any, any>, defineRoutes?: DefineRoutesFn) => RouteHelpers;
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
    init(appContext: AppContext<any>): ComponentFn<any, any, any>;
  };

  type StateBinding<T> = {
    readonly isBinding: true;
    $value: MutableState<T>;
    event: string;
  };

  export function h(element: string | ComponentLike<any, any, any>, attrs: Object, ...children: Template[]): Template;
  export function h(element: string | ComponentLike<any, any, any>, ...children: Template[]): Template;

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
    component: ComponentFn<any, { index: number; value: T }, void>,
    getKey?: (value: T) => any
  ): Template;

  export function repeat<T>(
    values: T[] | Observable<T[]>,
    component: Component<{ index: number; value: T }, void>,
    getKey?: (value: T) => any
  ): Template;

  export function bind<T>(value: MutableState<T>, event?: string): StateBinding<T>;

  /*==================================*\
  ||             Component            ||
  \*==================================*/

  /**
   * Shorthand type for anything that passes as a component wherever components are expected.
   */
  type ComponentLike<A, C> = Component<A, C> | ComponentFn<A, C>;

  type DefaultServicesType = any;
  type DefaultAttrsType = {};
  type DefaultChildrenType = void;

  export function makeComponent<
    ServicesType = DefaultServicesType,
    AttrsType = DefaultAttrsType,
    ChildrenType = DefaultChildrenType
  >(fn: ComponentFn<ServicesType, AttrsType, ChildrenType>): Component<ObservableAttrs<AttrsType>, ChildrenType>;

  export type ComponentFn<
    ServicesType = DefaultServicesType,
    AttrsType = DefaultAttrsType,
    ChildrenType = DefaultChildrenType
  > = (ctx: ComponentContext<ServicesType, AttrsType, ChildrenType>) => Element | null;

  // A convenient fiction for TypeScript's JSX checker. This does not actually resemble how components are implemented,
  // but it does resemble a factory function that returns a JSX element, which is a form that TS understands.
  export type Component<AttrsType, ChildrenType> = (props: ObservableAttrs<AttrsType>) => {
    init: ComponentFn<any, ObservableAttrs<AttrsType>, ChildrenType>;
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
    $attrs: State<UnwrappedAttrs<AttrsType>>;

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
     * Returns the service registered under `name` or throws an error if the service isn't registered.
     */
    getService<K extends keyof Services<ServicesType>>(name: K): Services<ServicesType>[K];

    /**
     * Returns an array of named services in the same order the names were passed.
     */
    getService<K extends keyof Services<ServicesType>>(names: K[]): any[];

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
   * Shorthand type for anything that passes as a service wherever services are expected.
   */
  type ServiceLike<E> = Service<E> | ServiceFn<E> | E;

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

  export type ServiceContext<ServicesType = any> = {
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
     * Returns the service registered under `name` or throws an error if the service isn't registered.
     */
    getService<K extends keyof Services<ServicesType>>(name: K): Services<ServicesType>[K];

    /**
     * Returns an array of named services in the same order the names were passed.
     */
    getService<K extends keyof Services<ServicesType>>(names: K[]): any[];

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

  export type StateOptions = {
    /**
     * Runs after each `.set()` call, before the new value is applied.
     * Returns an error message if the value doesn't pass validation.
     */
    validate: (value: unknown) => string | void;
  };

  export function makeState<Type>(initialValue?: Type, options?: StateOptions): MutableState<Type>;

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
  import type { Template, Component, ComponentFn, ToStringable } from "@woofjs/client";

  export function jsx(
    element: string | Component<any, any> | ComponentFn<any, any>,
    props: { [name: string]: any; children: Template },
    key: any
  ): Template;

  export function jsxs(
    element: string | Component<any, any> | ComponentFn<any, any>,
    props: { [name: string]: any; children: Template[] },
    key: any
  ): Template;
}

declare module "@woofjs/client/jsx-dev-runtime" {
  import type { Template, Component, ComponentFn } from "@woofjs/client";

  export function jsxDEV(
    element: string | Component<any, any> | ComponentFn<any, any>,
    props: { [name: string]: any; children: Template | Template[] },
    key: any,
    isStaticChildren: boolean,
    source: any,
    self: any
  ): Template;
}

// TODO: Define all elements and the attributes they support.
declare namespace JSX {
  import { ObservableAttrs, Observable, MutableState, ToStringable } from "@woofjs/client";
  import * as CSS from "csstype";

  type MaybeObservable<T> = T | Observable<T>;

  /**
   * The set of HTML attributes supported by all HTML elements.
   */
  interface HTMLGlobalAttributes {
    /**
     * The accesskey global attribute provides a hint for generating a keyboard shortcut
     * for the current element. The attribute value must consist of a single printable character
     * (which includes accented and other characters that can be generated by the keyboard).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey
     */
    accesskey: string;

    /**
     * The autocapitalize global attribute is an enumerated attribute that controls whether and
     * how text input is automatically capitalized as it is entered/edited by the user.
     *
     * The attribute must take one of the following values:
     *   - `off` or `none`: No autocapitalization is applied (all letters default to lowercase)
     *   - `on` or `sentences`: The first letter of each sentence defaults to a capital letter; all other letters default to lowercase
     *   - `words`: The first letter of each word defaults to a capital letter; all other letters default to lowercase
     *   - `characters`: All letters should default to uppercase
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize
     */
    autocapitalize: "off" | "on" | "none" | "sentences" | "words" | "characters";

    /**
     * The `autofocus` attribute allows the author to indicate that an element
     * is to be focused as soon as the page is loaded or as soon as the dialog within
     * which it finds itself is shown, allowing the user to just start typing without
     * having to manually focus the main element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus
     */
    autofocus: boolean;

    /**
     * CSS classes to be applied to this element. In addition to the standard space-separated list of class names,
     * this attribute is expanded in Woof to also support a class map object with class names as keys and booleans as values.
     * Class names in a class map will be applied to the element while their values are true. Also supports an
     * array of strings and class maps.
     *
     * @example
     * <div class="standard usage" />
     *
     * @example
     * <div class={["array", "of", "classes"]} />
     *
     * @example
     * <div class={{
     *   applied: true,
     *   notApplied: false
     * }} />
     *
     * @example
     * <div class={["class", "class2", { "conditional": $value }]} />
     */
    class: string | ClassMap | Array<string | ClassMap | (string | ClassMap)[]>;

    /**
     * Specifies whether the element's content can be edited.
     *
     * @see https://html.spec.whatwg.org/multipage/interaction.html#attr-contenteditable
     */
    contenteditable: "" | "true" | "false";

    /**
     * Specifies the element's text directionality.
     *
     * @see https://html.spec.whatwg.org/multipage/dom.html#attr-dir
     */
    dir: "ltr" | "rtl" | "auto";

    /**
     * Specifies whether the element is draggable for use with the [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API).
     *
     * @see https://html.spec.whatwg.org/multipage/dnd.html#attr-draggable
     */
    draggable: "true" | "false";

    /**
     * The `enterkeyhint` attribute defines what action label (or icon) to present for the enter key on virtual keyboards.
     * This allows authors to customize the presentation of the enter key in order to make it more helpful for users.
     *
     * @see https://html.spec.whatwg.org/multipage/interaction.html#attr-enterkeyhint
     */
    enterkeyhint: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";

    /**
     * The `hidden` global attribute is a Boolean attribute indicating that the element is not yet,
     * or is no longer, relevant. For example, it can be used to hide elements of the page that can't
     * be used until the login process has been completed. Browsers won't render elements with the `hidden` attribute set.
     *
     * @see https://html.spec.whatwg.org/multipage/interaction.html#attr-hidden
     */
    hidden: boolean;

    /**
     * The `id` defines an identifier (ID) which must be unique in the whole document. Its purpose is
     * to identify the element when linking, scripting, or styling with CSS.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id
     */
    id: ToStringable;

    /**
     * @see https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute
     */
    inert;

    /**
     * The `inputmode` content attribute is an enumerated attribute that specifies what kind of input mechanism would be most helpful for users entering content.
     */
    inputmode: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";

    /**
     * @see https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is
     */
    is: string;

    /**
     * @see https://html.spec.whatwg.org/multipage/microdata.html#encoding-microdata
     */
    itemid: string;

    /**
     * @see https://html.spec.whatwg.org/multipage/microdata.html#encoding-microdata
     */
    itemprop: string;

    /**
     * @see https://html.spec.whatwg.org/multipage/microdata.html#encoding-microdata
     */
    itemref: string;

    /**
     * @see https://html.spec.whatwg.org/multipage/microdata.html#encoding-microdata
     */
    itemscope: boolean;

    /**
     * @see https://html.spec.whatwg.org/multipage/microdata.html#encoding-microdata
     */
    itemtype: string;

    /**
     * The `lang` global attribute helps define the language of an element: the language that non-editable elements are written in,
     * or the language that the editable elements should be written in by the user. The attribute contains a single "language tag"
     * in the format defined in [RFC 5646: Tags for Identifying Languages (also known as BCP 47)](https://datatracker.ietf.org/doc/html/rfc5646).
     *
     * @example
     * ```html
     * <span lang="ja">おはようございます</span>
     * ```
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang
     */
    lang: string;

    /**
     * @see https://html.spec.whatwg.org/multipage/urls-and-fetching.html#attr-nonce
     */
    nonce: string;

    /**
     * Specifies if the element is to have its spelling and grammar checked.
     *
     * @see https://html.spec.whatwg.org/multipage/interaction.html#attr-spellcheck
     */
    spellcheck: "" | "true" | "false";

    /**
     * Inline CSS styles.
     */
    style: Styles;

    /**
     * @see https://html.spec.whatwg.org/multipage/interaction.html#attr-tabindex
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
     */
    tabindex: number;

    /**
     * The `title` attribute represents advisory information for the element, such as would be appropriate for a tooltip.
     * On a link, this could be the title or a description of the target resource; on an image, it could be the image credit
     * or a description of the image; on a paragraph, it could be a footnote or commentary on the text; on a citation,
     * it could be further information about the source; on interactive content, it could be a label for, or instructions for,
     * use of the element; and so forth.
     *
     * @see https://html.spec.whatwg.org/multipage/dom.html#attr-title
     */
    title: string;

    /**
     * The `translate` global attribute is an enumerated attribute that is used to specify whether an element's _translatable attribute_
     *  values and its `Text` node children should be translated when the page is localized, or whether to leave them unchanged.
     *
     * @see https://html.spec.whatwg.org/multipage/dom.html#attr-translate
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate
     */
    translate: "" | "yes" | "no";
  }

  interface Styles extends CSS.Properties, CSS.PropertiesHyphen {}

  interface ClassMap {
    [className: string]: boolean | Observable<boolean>;
  }

  type EventHandler<E> = (event: E) => void;

  interface HTMLGlobalEvents {
    /**
     * The `auxclick` event is fired at an Element when a non-primary pointing device button
     * (any mouse button other than the primary—usually leftmost—button) has been pressed
     * and released both within the same element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/auxclick_event
     */
    onauxclick: EventHandler<PointerEvent>;
    /**
     * The `beforeinput` event fires when the value of an `<input>` or `<textarea>` element is about to be modified.
     * The event also applies to elements with `contenteditable` enabled, and to any element when `designMode` is turned on.
     *
     * This allows web apps to override text edit behavior before the browser modifies the DOM tree, and provides more control
     * over input events to improve performance.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event
     */
    onbeforeinput: EventHandler<InputEvent>;

    onbeforematch: EventHandler<Event>;
    /**
     * The `blur` event fires when an element has lost focus.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event
     */
    onblur: EventHandler<Event>;
    /**
     * The `cancel` event fires on a `<dialog>` when the user instructs the browser that they wish to dismiss the current open dialog.
     * For example, the browser might fire this event when the user presses the `Esc` key or clicks a "Close dialog" button which is part of the browser's UI.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/cancel_event
     */
    oncancel: EventHandler<Event>;

    /**
     * The `change` event is fired for `<input>`, `<select>`, and `<textarea>` elements when the user modifies the element's value.
     * Unlike the `input` event, the change event is not necessarily fired for each alteration to an element's value.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
     */
    onchange: EventHandler<Event>;
    /**
     * An element receives a `click` event when a pointing device button (such as a mouse's primary mouse button) is both pressed
     * and released while the pointer is located inside the element.
     *
     * `click` fires after both the `mousedown` and `mouseup` events have fired, in that order.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
     */
    onclick: EventHandler<PointerEvent>;
    /**
     * The `close` event is fired on an `HTMLDialogElement` object when the dialog it represents has been closed.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close_event
     */
    onclose: EventHandler<Event>;

    oncontextlost: EventHandler<Event>;
    /**
     * The `contextmenu` event fires when the user attempts to open a context menu.
     * This event is typically triggered by clicking the right mouse button, or by pressing the context menu key.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event
     */
    oncontextmenu: EventHandler<PointerEvent>;

    oncontextrestored: EventHandler<Event>;
    /**
     * The `cuechange` event fires when a `TextTrack` has changed the currently displaying cues.
     * The event is fired on both the `TextTrack` and the `HTMLTrackElement` in which it's being presented, if any.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLTrackElement/cuechange_event
     */
    oncuechange: EventHandler<Event>;
    /**
     * The `dblclick` event fires when a pointing device button (such as a mouse's primary button) is double-clicked;
     * that is, when it's rapidly clicked twice on a single element within a very short span of time.
     *
     * `dblclick` fires after two `click` events (and by extension, after two pairs of `mousedown` and `mouseup` events).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event
     */
    ondblclick: EventHandler<MouseEvent>;
    /**
     * The `drag` event is fired every few hundred milliseconds as an element or text selection is being dragged by the user.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event
     */
    ondrag: EventHandler<DragEvent>;
    /**
     * The `dragend` event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragend_event
     */
    ondragend: EventHandler<DragEvent>;
    /**
     * The `dragenter` event is fired when a dragged element or text selection enters a valid drop target.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragenter_event
     */
    ondragenter: EventHandler<DragEvent>;
    /**
     * The `dragleave` event is fired when a dragged element or text selection leaves a valid drop target.
     *
     * This event is not cancelable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragleave_event
     */
    ondragleave: EventHandler<DragEvent>;
    /**
     * The `dragover` event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds).
     *
     * The event is fired on the drop target(s).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event
     */
    ondragover: EventHandler<Event>;
    /**
     * The `dragstart` event is fired when the user starts dragging an element or text selection.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event
     */
    ondragstart: EventHandler<Event>;
    /**
     * The drop event is fired when an element or text selection is dropped on a valid drop target.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event
     */
    ondrop: EventHandler<PointerEvent>;
    /**
     * The `durationchange` event is fired when the `duration` attribute of a media element (`<audio>`, `<video>`) has been updated.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/durationchange_event
     */
    ondurationchange: EventHandler<Event>;
    /**
     * The `error` event is fired on an `Element` object when a resource failed to load, or can't be used.
     * For example, if a script has an execution error or an image can't be found or is invalid.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/error_event
     */
    onerror: EventHandler<ErrorEvent>;
    /**
     * The `focus` event fires when an element has received focus.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event
     */
    onfocus: EventHandler<Event>;
    /**
     * The `formdata` event fires after the entry list representing the form's data is constructed.
     * This happens when the form is submitted, but can also be triggered by the invocation of a `FormData()` constructor.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event
     */
    onformdata: EventHandler<FormDataEvent>;
    /**
     * The `input` event fires when the value of an `<input>`, `<select>`, or `<textarea>` element has been changed.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event
     */
    oninput: EventHandler<InputEvent>;
    /**
     * The `invalid` event fires when a submittable element has been checked for validity and doesn't satisfy its constraints.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event
     */
    oninvalid: EventHandler<Event>;
    /**
     * The` keydown` event is fired when a key is pressed.
     *
     * Unlike the `keypress` event, the `keydown` event is fired for all keys, regardless of whether they produce a character value.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event
     */
    onkeydown: EventHandler<KeyboardEvent>;
    /**
     * The `keypress` event is fired when a key that produces a character value is pressed down.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/keypress_event
     * @deprecated
     */
    onkeypress: EventHandler<KeyboardEvent>;
    /**
     * The `keyup` event is fired when a key is released.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/keyup_event
     */
    onkeyup: EventHandler<KeyboardEvent>;

    onload: EventHandler<Event>;
    /**
     * The `loadeddata` event is fired when the frame at the current playback position of the media has finished loading; often the first frame.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadeddata_event
     */
    onloadeddata: EventHandler<Event>;
    /**
     * The `loadedmetadata` event is fired when the metadata has been loaded.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadedmetadata_event
     */
    onloadedmetadata: EventHandler<Event>;
    /**
     * The `loadstart` event is fired when the browser has started to load a resource.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadstart_event
     */
    onloadstart: EventHandler<Event>;
    /**
     * The `mousedown` event is fired at an element when a pointing device button is pressed while the pointer is inside the element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event
     */
    onmousedown: EventHandler<MouseEvent>;
    /**
     * The `mouseenter` event is fired at an element when a pointing device (usually a mouse) is initially moved
     * so that its hotspot is within the element at which the event was fired.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event
     */
    onmouseenter: EventHandler<MouseEvent>;
    /**
     * The `mouseleave` event is fired at an element when the cursor of a pointing device (usually a mouse) is moved out of it.
     *
     * `mouseleave` and `mouseout` are similar but differ in that `mouseleave` does not bubble and `mouseout` does.
     * This means that `mouseleave` is fired when the pointer has exited the element and all of its descendants,
     * whereas `mouseout` is fired when the pointer leaves the element or leaves one of the element's descendants
     * (even if the pointer is still within the element).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event
     */
    onmouseleave: EventHandler<MouseEvent>;
    /**
     * The `mousemove` event is fired at an element when a pointing device (usually a mouse) is moved while the cursor's hotspot is inside it.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
     */
    onmousemove: EventHandler<MouseEvent>;
    /**
     * The `mouseout` event is fired at an element when a pointing device (usually a mouse) is used to move the cursor
     * so that it is no longer contained within the element or one of its children.
     *
     * `mouseout` is also delivered to an element if the cursor enters a child element, because the child element obscures the visible area of the element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseout_event
     */
    onmouseout: EventHandler<MouseEvent>;
    /**
     * The `mouseover` event is fired at an element when a pointing device (such as a mouse or trackpad) is used
     * to move the cursor onto the element or one of its child elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event
     */
    onmouseover: EventHandler<MouseEvent>;
    /**
     * The `mouseup` event is fired at an element when a button on a pointing device (such as a mouse or trackpad) is released while the pointer is located inside it.
     *
     * `mouseup` events are the counterpoint to `mousedown` events.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseup_event
     */
    onmouseup: EventHandler<MouseEvent>;
    /**
     * The `reset` event fires when a `<form>` is reset.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset_event
     */
    onreset: EventHandler<Event>;
    /**
     * The `scroll` event fires when an element has been scrolled.
     *
     * **Note:** In iOS UIWebViews, scroll events are not fired while scrolling is taking place; they are only fired after the scrolling has completed.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event
     */
    onscroll: EventHandler<Event>;
    /**
     * The `select` event fires when some text has been selected.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/select_event
     */
    onselect: EventHandler<Event>;
    /**
     * The `slotchange` event is fired on a `<slot>` element when the node(s) contained in that slot change.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/slotchange_event
     */
    onslotchange: EventHandler<Event>;
    /**
     * The `submit` event fires when a `<form>` is submitted.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
     */
    onsubmit: EventHandler<SubmitEvent>;
    /**
     * The `toggle` event fires when the open/closed state of a `<details>` element is toggled.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement/toggle_event
     */
    ontoggle: EventHandler<Event>;
    /**
     * The `animationend` event is fired when a CSS Animation has completed. If the animation aborts before reaching completion,
     * such as if the element is removed from the DOM or the animation is removed from the element, the `animationend` event is not fired.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event
     */
    onanimationend: EventHandler<Event>;
    /**
     * The `animationiteration` event is fired when an iteration of a CSS Animation ends, and another one begins.
     * This event does not occur at the same time as the `animationend` event, and therefore does not occur for animations
     * with an `animation-iteration-count` of one.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/animationiteration_event
     */
    onanimationiteration: EventHandler<Event>;
    /**
     * The `animationstart` event is fired when a CSS Animation has started. If there is an `animation-delay`, this event will fire
     * once the delay period has expired. A negative delay will cause the event to fire with an `elapsedTime` equal to the absolute value
     * of the delay (and, correspondingly, the animation will begin playing at that time index into the sequence).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/animationstart_event
     */
    onanimationstart: EventHandler<Event>;
    /**
     * The `transitionend` event is fired when a CSS transition has completed. In the case where a transition is removed before completion,
     * such as if the `transition-property` is removed or `display` is set to `none`, then the event will not be generated.
     *
     * The `transitionend` event is fired in both directions - as it finishes transitioning to the transitioned state,
     * and when it fully reverts to the default or non-transitioned state. If there is no transition delay or duration,
     * if both are 0s or neither is declared, there is no transition, and none of the transition events are fired.
     * If the `transitioncancel` event is fired, the `transitionend` event will not fire.
     *
     * This event is not cancelable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event
     */
    ontransitionend: EventHandler<Event>;
    /**
     * The `wheel` event fires when the user rotates a wheel button on a pointing device (typically a mouse).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
     */
    onwheel: EventHandler<WheelEvent>;
  }

  // TODO: Move media events that don't bubble into this interface
  interface HTMLMediaElementEvents {
    /**
     * The `abort` event is fired when the resource was not fully loaded, but not as the result of an error.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/abort_event
     */
    onabort: EventHandler<Event>;
    /**
     * The `canplay` event is fired when the user agent can play the media, but estimates that not enough data has been loaded
     * to play the media up to its end without having to stop for further buffering of content.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplay_event
     */
    oncanplay: EventHandler<Event>;
    /**
     * The `canplaythrough` event is fired when the user agent can play the media, and estimates that enough data has been loaded
     * to play the media up to its end without having to stop for further buffering of content.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplaythrough_event
     */
    oncanplaythrough: EventHandler<Event>;
    /**
     * The `emptied` event is fired when the media has become empty; for example, this event is sent if the media has already been loaded
     * (or partially loaded), and the `load()` method is called to reload it.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/emptied_event
     */
    onemptied: EventHandler<Event>;
    /**
     * The `ended` event is fired when playback or streaming has stopped because the end of the media was reached or because no further data is available.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event
     */
    onended: EventHandler<Event>;
    /**
     * The `pause` event is sent when a request to pause an activity is handled and the activity has entered its paused state,
     * most commonly after the media has been paused through a call to the element's `pause()` method.
     *
     * The event is sent once the `pause()` method returns and after the media element's `paused` property has been changed to `true`.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause_event
     */
    onpause: EventHandler<Event>;
    /**
     * The `play` event is fired when the `paused` property is changed from `true` to `false`, as a result of the `play` method, or the `autoplay` attribute.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play_event
     */
    onplay: EventHandler<Event>;
    /**
     * The `playing` event is fired after playback is first started, and whenever it is restarted.
     * For example it is fired when playback resumes after having been paused or delayed due to lack of data.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playing_event
     */
    onplaying: EventHandler<Event>;
    /**
     * The `progress` event is fired periodically as the browser loads a resource.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/progress_event
     */
    onprogress: EventHandler<Event>;
    /**
     * The `ratechange` event is fired when the playback rate has changed.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ratechange_event
     */
    onratechange: EventHandler<Event>;
    /**
     * The `seeked` event is fired when a seek operation completed, the current playback position has changed, and the Boolean `seeking` attribute is changed to `false`.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeked_event
     */
    onseeked: EventHandler<Event>;
    /**
     * The `seeking` event is fired when a seek operation starts, meaning the Boolean `seeking` attribute has changed to `true` and the media is seeking a new position.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeking_event
     */
    onseeking: EventHandler<Event>;
    /**
     * The `stalled` event is fired when the user agent is trying to fetch media data, but data is unexpectedly not forthcoming.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/stalled_event
     */
    onstalled: EventHandler<Event>;
    /**
     * The `suspend` event is fired when media data loading has been suspended.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/suspend_event
     */
    onsuspend: EventHandler<Event>;
    /**
     * The `timeupdate` event is fired when the time indicated by the `currentTime` attribute has been updated.
     *
     * The event frequency is dependent on the system load, but will be thrown between about 4Hz and 66Hz(assuming the event handlers don't take longer than 250ms to run).
     * User agents are encouraged to vary the frequency of the event based on the system load and the average cost of processing the event each time,
     * so that the UI updates are not any more frequent than the user agent can comfortably handle while decoding the video.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/timeupdate_event
     */
    ontimeupdate: EventHandler<Event>;
    /**
     * The `volumechange` event is fired when the volume has changed.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volumechange_event
     */
    onvolumechange: EventHandler<Event>;
    /**
     * The `waiting` event is fired when playback has stopped because of a temporary lack of data.
     *
     * This event is not cancelable and does not bubble.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/waiting_event
     */
    onwaiting: EventHandler<Event>;
  }

  interface HTMLDocumentAndElementEvents {
    /**
     * The `copy` event fires when the user initiates a copy action through the browser's user interface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/copy_event
     */
    oncopy: EventHandler<ClipboardEvent>;
    /**
     * The `cut` event is fired when the user has initiated a "cut" action through the browser's user interface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/cut_event
     */
    oncut: EventHandler<Event>;
    /**
     * The `paste` event is fired when the user has initiated a "paste" action through the browser's user interface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
     */
    onpaste: EventHandler<Event>;
  }

  type PartialGlobals = Partial<HTMLGlobalAttributes>;

  type GlobalAttributes = {
    [K in keyof PartialGlobals]: MaybeObservable<PartialGlobals[K]>;
  };

  type PartialEvents = Partial<HTMLGlobalEvents> & Partial<HTMLDocumentAndElementEvents>;

  type GlobalEvents = {
    [K in keyof PartialEvents]: MaybeObservable<PartialEvents[K]>;
  };

  interface ElementAttributes<T extends HTMLElement> extends GlobalAttributes, GlobalEvents {
    /**
     * A state that receives a reference to the DOM element.
     */
    $ref?: MutableState<HTMLElement>;
  }

  /**
   * The following elements are defined based on the WHATWG HTML spec:
   * https://html.spec.whatwg.org/multipage/#toc-semantics
   **/

  /*====================================*\
  || 4.3                       Sections ||
  \*====================================*/

  interface ArticleElementAttributes extends ElementAttributes<HTMLAnchorElement> {}
  interface SectionElementAttributes extends ElementAttributes<HTMLElement> {}
  interface NavElementAttributes extends ElementAttributes<HTMLElement> {}
  interface AsideElementAttributes extends ElementAttributes<HTMLElement> {}
  interface H1ElementAttributes extends ElementAttributes<HTMLHeadingElement> {}
  interface H2ElementAttributes extends ElementAttributes<HTMLHeadingElement> {}
  interface H3ElementAttributes extends ElementAttributes<HTMLHeadingElement> {}
  interface H4ElementAttributes extends ElementAttributes<HTMLHeadingElement> {}
  interface H5ElementAttributes extends ElementAttributes<HTMLHeadingElement> {}
  interface H6ElementAttributes extends ElementAttributes<HTMLHeadingElement> {}
  interface HgroupElementAttributes extends ElementAttributes<HTMLElement> {}
  interface HeaderElementAttributes extends ElementAttributes<HTMLElement> {}
  interface FooterElementAttributes extends ElementAttributes<HTMLElement> {}
  interface AddressElementAttributes extends ElementAttributes<HTMLElement> {}

  interface IntrinsicElements {
    /**
     * The `article` element represents a complete, or self-contained, composition in a document, page, application,
     * or site and that is, in principle, independently distributable or reusable, e.g. in syndication. This could be a forum post,
     * a magazine or newspaper article, a blog entry, a user-submitted comment, an interactive widget or gadget,
     * or any other independent item of content.
     *
     * When `article` elements are nested, the inner `article` elements represent articles that are in principle
     * related to the contents of the outer article. For instance, a blog entry on a site that accepts user-submitted
     * comments could represent the comments as `article` elements nested within the `article` element for the blog entry.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-article-element
     */
    article: ArticleElementAttributes;

    /**
     * The `section` element represents a generic section of a document or application. A section, in this context,
     * is a thematic grouping of content, typically with a heading.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-section-element
     */
    section: SectionElementAttributes;

    /**
     * The `nav` element represents a section of a page that links to other pages or to parts within the page: a section with navigation links.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-nav-element
     */
    nav: NavElementAttributes;

    /**
     * The `aside` element represents a section of a page that consists of content that is tangentially related
     * to the content around the `aside` element, and which could be considered separate from that content.
     * Such sections are often represented as sidebars in printed typography.
     *
     * The element can be used for typographical effects like pull quotes or sidebars, for advertising,
     * for groups of nav elements, and for other content that is considered separate from the main content of the page.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-aside-element
     */
    aside: AsideElementAttributes;

    /**
     * A heading for a top-level section.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
     */
    h1: H1ElementAttributes;

    /**
     * A heading for a subsection.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
     */
    h2: H2ElementAttributes;

    /**
     * A heading for a sub-subsection.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
     */
    h3: H3ElementAttributes;

    /**
     * A heading for a sub-sub-subsection.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
     */
    h4: H4ElementAttributes;

    /**
     * A heading for a sub-sub-sub-subsection.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
     */
    h5: H5ElementAttributes;

    /**
     * A heading for a sub-sub-sub-subsection.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
     */
    h6: H6ElementAttributes;

    /**
     * The `hgroup` element represents a heading and related content. The element may be used to group an
     * `h1`–`h6` element with one or more `p` elements containing content representing a subheading,
     * alternative title, or tagline.
     *
     * @example
     * ```html
     * <hgroup>
     *   <h1>Dr. Strangelove</h1>
     *   <p>Or: How I Learned to Stop Worrying and Love the Bomb</p>
     * </hgroup>
     * ```
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-hgroup-element
     */
    hgroup: HgroupElementAttributes;

    /**
     * The `header` element represents a group of introductory or navigational aids.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-header-element
     */
    header: HeaderElementAttributes;

    /**
     * The `footer` element represents a footer for its nearest ancestor `article`, `aside`, `nav`, or `section`,
     * or for the `body` element if there is no such ancestor. A footer typically contains information about
     * its section such as who wrote it, links to related documents, copyright data, and the like.
     *
     * When the `footer` element contains entire sections, they represent appendices, indices, long colophons,
     * verbose license agreements, and other such content.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-footer-element
     */
    footer: FooterElementAttributes;

    /**
     * The `address` element represents the contact information for its nearest `article` or `body` element ancestor.
     * If that is the `body` element, then the contact information applies to the document as a whole.
     *
     * @see https://html.spec.whatwg.org/multipage/sections.html#the-address-element
     */
    address: AddressElementAttributes;
  }

  /*====================================*\
  || 4.4               Grouping content ||
  \*====================================*/

  interface PElementAttributes extends ElementAttributes<HTMLParagraphElement> {}
  interface HrElementAttributes extends ElementAttributes<HTMLHRElement> {}
  interface PreElementAttributes extends ElementAttributes<HTMLPreElement> {}
  interface BlockquoteElementAttributes extends ElementAttributes<HTMLQuoteElement> {
    /**
     * Link to the source of the quotation. Must be a valid URL potentially surrounded by spaces.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#attr-blockquote-cite
     */
    cite?: MaybeObservable<string | undefined>;
  }
  interface OlElementAttributes extends ElementAttributes<HTMLOListElement> {
    /**
     * Indicates that the list is a descending list (..., 3, 2, 1).
     * If the attribute is omitted, the list is an ascending list (1, 2, 3, ...).
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#attr-ol-reversed
     */
    reversed?: MaybeObservable<boolean | undefined>;

    /**
     * Starting value of the list.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#attr-ol-start
     */
    start?: MaybeObservable<number | undefined>;

    /**
     * The `type` attribute can be used to specify the kind of marker to use in the list,
     * in the cases where that matters (e.g. because items are to be referenced by their number/letter).
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#attr-ol-type
     */
    type?: MaybeObservable<"l" | "a" | "A" | "i" | "I" | undefined>;
  }
  interface UlElementAttributes extends ElementAttributes<HTMLUListElement> {}
  interface MenuElementAttributes extends ElementAttributes<HTMLMenuElement> {}
  interface LiElementAttributes extends ElementAttributes<HTMLLIElement> {}
  interface DlElementAttributes extends ElementAttributes<HTMLDListElement> {}
  interface DtElementAttributes extends ElementAttributes<HTMLElement> {}
  interface DdElementAttributes extends ElementAttributes<HTMLElement> {}
  interface FigureElementAttributes extends ElementAttributes<HTMLElement> {}
  interface FigcaptionElementAttributes extends ElementAttributes<HTMLElement> {}
  interface MainElementAttributes extends ElementAttributes<HTMLElement> {}
  interface DivElementAttributes extends ElementAttributes<HTMLDivElement> {}

  interface IntrinsicElements {
    /**
     * The `p` element represents a paragraph.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element
     */
    p: PElementAttributes;

    /**
     * The `hr` element represents a paragraph-level thematic break, e.g. a scene change in a story,
     * or a transition to another topic within a section of a reference book.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-hr-element
     */
    hr: HrElementAttributes;

    /**
     * The `pre` element represents a block of preformatted text, in which structure is represented
     * by typographic conventions rather than by elements.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
     */
    pre: PreElementAttributes;

    /**
     * The `blockquote` element represents a section that is quoted from another source.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element
     */
    blockquote: BlockquoteElementAttributes;

    /**
     * The `ol` element represents a list of items, where the items have been intentionally ordered,
     * such that changing the order would change the meaning of the document.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-ol-element
     */
    ol: OlElementAttributes;

    /**
     * The `ul` element represents a list of items, where the order of the items is not important —
     * that is, where changing the order would not materially change the meaning of the document.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element
     */
    ul: UlElementAttributes;

    /**
     * The `menu` element represents a toolbar consisting of its contents, in the form of
     * an unordered list of items (represented by `li` elements), each of which represents
     * a command that the user can perform or activate.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-menu-element
     */
    menu: MenuElementAttributes;

    /**
     * The `li` element represents a list item. If its parent element is an `ol`, `ul`, or `menu` element,
     * then the element is an item of the parent element's list.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element
     */
    li: LiElementAttributes;

    /**
     * The `dl` element represents an association list consisting of zero or more name-value groups
     * (a description list). Name-value groups may be terms and definitions, metadata topics and values,
     * questions and answers, or any other groups of name-value data.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-dl-element
     */
    dl: DlElementAttributes;

    /**
     * The `dt` element represents the term, or name, part of a term-description group in a description list (`dl` element).
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-dt-element
     */
    dt: DtElementAttributes;

    /**
     * The `dd` element represents the description, definition, or value, part of a term-description group in a description list (`dl` element).
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-dd-element
     */
    dd: DdElementAttributes;

    /**
     * The `figure` element represents some [flow content](https://html.spec.whatwg.org/multipage/dom.html#flow-content-2),
     * optionally with a caption, that is self-contained (like a complete sentence) and is typically referenced as
     * a single unit from the main flow of the document.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-figure-element
     */
    figure: FigureElementAttributes;

    /**
     * The `figcaption` element represents a caption or legend for the rest of the contents of the
     * `figcaption` element's parent `figure` element, if any.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-figcaption-element
     */
    figcaption: FigcaptionElementAttributes;

    /**
     * The `main` element represents the dominant contents of the document. A document must not
     * have more than one `main` element that does not have the `hidden` attribute specified.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element
     */
    main: MainElementAttributes;

    /**
     * The `div` element has no special meaning at all. It represents its children.
     *
     * Authors are strongly encouraged to view the `div` element as an element of last resort,
     * for when no other element is suitable. Use of more appropriate elements instead of the `div`
     * element leads to better accessibility for readers and easier maintainability for authors.
     *
     * @see https://html.spec.whatwg.org/multipage/grouping-content.html#the-div-element
     */
    div: DivElementAttributes;
  }

  /*====================================*\
  || 4.5           Text-level semantics ||
  \*====================================*/

  /**
   * Attributes for an HTML `<a>` element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
   */
  interface AnchorElementAttributes extends ElementAttributes<HTMLAnchorElement> {
    /**
     * A hyperlink address. Must be a valid URL potentially surrounded by spaces.
     *
     * @see https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element
     */
    href?: MaybeObservable<string | undefined>;

    /**
     * The `target` attribute, if present, must be a valid browsing context name or keyword.
     * It gives the name of the browsing context that will be used. User agents use this name when following hyperlinks.
     *
     * A common usage is `target: "_blank"` to cause a link to open in a new tab.
     *
     * @see https://html.spec.whatwg.org/multipage/links.html#attr-hyperlink-target
     * @see https://html.spec.whatwg.org/multipage/browsers.html#valid-browsing-context-name-or-keyword
     */
    target?: MaybeObservable<string | undefined>;

    /**
     * The `download` attribute is a string indicating that the linked resource is intended to be downloaded rather than displayed in the browser.
     * The value, if any, specifies the default file name for use in labeling the resource in a local file system.
     * If the name is not a valid file name in the underlying OS, the browser will adjust it.
     *
     * @see https://html.spec.whatwg.org/multipage/links.html#attr-hyperlink-download
     */
    download?: MaybeObservable<string | undefined>;

    /**
     * A space-separated list of URLs. When the link is followed, the browser will send `POST` requests with the body PING to the URLs.
     * Typically for tracking.
     *
     * @see https://html.spec.whatwg.org/multipage/links.html#ping
     */
    ping?: MaybeObservable<string | undefined>;

    /**xs
     *
     *
     * @see https://html.spec.whatwg.org/multipage/links.html#attr-hyperlink-rel
     */
    rel?: MaybeObservable<string | undefined>;
  }

  interface IntrinsicElements {
    a: AnchorElementAttributes;
  }

  /*====================================*\
  || 4.6                          Links ||
  \*====================================*/

  /*====================================*\
  || 4.7                          Edits ||
  \*====================================*/

  /*====================================*\
  || 4.8               Embedded Content ||
  \*====================================*/

  /*====================================*\
  || 4.9                   Tabular Data ||
  \*====================================*/

  /*====================================*\
  || 4.10                         Forms ||
  \*====================================*/

  /*====================================*\
  || 4.11          Interactive elements ||
  \*====================================*/

  /*====================================*\
  || 4.12                     Scripting ||
  \*====================================*/

  // Temp fallback while types are being worked on.
  interface IntrinsicElements {
    [tagname: string]: any;
  }

  interface ElementClass {
    init: any;
  }
}

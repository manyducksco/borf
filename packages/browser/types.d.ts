declare module "@borf/browser" {
  import { History } from "history";

  interface AddStoreOptions<I> {
    inputs: I;
  }

  /**
   * Registers views as HTML custom elements. All elements on a hub have access to any stores on that hub.
   */
  export class ElementHub {
    constructor();

    addStore<I>(store: Store<I, any>, options: AddStoreOptions<I>): this;
    addElement(tag: string, component: View | Store): this;

    connect(): Promise<void>;
  }

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
       * @example "store:*,-store:test" // matches everything starting with "store" except "store:test"
       */
      filter?: string | RegExp;

      /**
       * Print log messages when true. Default: true for development builds, false for production builds.
       */
      log?: boolean | "development";

      /**
       * Print warn messages when true. Default: true for development builds, false for production builds.
       */
      warn?: boolean | "development";

      /**
       * Print error messages when true. Default: true.
       */
      error?: boolean | "development";
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

  type Translation = Record<string, string | Translation>;

  /**
   * An app is the central object of a Woof app. It handles mounting and unmounting of routes
   * based on the current URL and providing globals to views rendered under those routes.
   */
  export class App {
    readonly isConnected: boolean;

    /**
     * Creates a new app.
     *
     * @param options - Configuration options.
     */
    constructor(options: AppOptions);

    /**
     * Connects the app and begins routing. Routes are rendered as children of the `root` element.
     *
     * @param root - DOM node or a selector string.
     */
    connect(root: string | Node): Promise<void>;

    /**
     * Disconnects the app.
     */
    disconnect(): Promise<void>;

    /**
     * Adds a new root view which is displayed by the app at all times.
     * All routes added to the app will render inside this view's `ctx.outlet()`.
     *
     * @param view - A View or a standalone setup function.
     */
    addRootView<I>(view: ViewLike<I>): this;

    /**
     * Adds a new global store which will be available to every component within this App.
     *
     * @param store - A Store or a standalone setup function.
     */
    addStore<I>(store: StoreLike<I>): this;

    /**
     * Adds a new language the app can be translated into.
     *
     * @param tag - A valid BCP47 language tag, like `en-US`, `en-GB`, `ja`, etc.
     * @param config - Language configuration.
     */
    addLanguage(tag: string, config: LanguageConfig): this;

    /**
     * Sets the initial language. The app will default to the first language added if this is not called.
     */
    setLanguage(tag: string): this;

    /**
     * Sets the initial language based on the user's locale.
     * Falls back to `fallback` language if provided, otherwise falls back to the first language added.
     *
     * @param tag - Set to "auto" to autodetect the user's language.
     * @param fallback - The language tag to default to if the app fails to detect an appropriate language.
     */
    setLanguage(tag: "auto", fallback?: string): this;

    /**
     * Adds a new pattern, a view to display while that pattern matches the current URL, and an optional function to configure nested routes and redirects.
     * Route chaining allows you to add nested routes and redirects that are displayed within the `view`'s outlet while `pattern` matches the current URL.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param view - The view to display while `pattern` matches the current URL.
     * @param extend - A callback that takes a router to configure nested routes and redirects.
     */
    addRoute<I>(pattern: string, view: ViewLike<I>, extend?: (sub: AppRouter) => void): this;

    /**
     * Adds a new pattern and a set of nested routes that are displayed without a layout `view`.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param view - Pass null to render subroutes without a parent view.
     * @param extend - A callback that takes a router to configure nested routes and redirects.
     */
    addRoute(pattern: string, view: null, extend: (sub: AppRouter) => void): this;

    /**
     * Adds a new pattern that will redirect to a different path when matched.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param redirectPath - A path to redirect to when `pattern` matches the current URL.
     */
    addRedirect(pattern: string, redirectPath: string): this;

    /**
     * Adds a new pattern that will redirect to a different path when matched, as calculated by a callback function.
     * Useful when you require more insight into the path that matched the pattern before deciding where to send the user.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param createPath - A function that generates a redirect path from the current URL match.
     */
    addRedirect(pattern: string, createPath: (ctx: RedirectContext) => string): this;
  }

  // TODO: Is there a good way to represent infinitely nested recursive types?
  /**
   * An object where values are either a translated string or another nested Translation object.
   */
  type Translation = Record<string, string | Record<string, string | Record<string, string | Record<string, string>>>>;

  interface LanguageConfig {
    /**
     * The translated strings for this language, or a callback function that returns them.
     */
    translation: Translation | (() => Translation) | (() => Promise<Translation>);
  }

  interface AppRouter {
    /**
     * Adds a new pattern, a view to display while that pattern matches the current URL, and an optional function to configure route chaining.
     * Route chaining allows you to add nested routes and redirects that are displayed within the `view`'s outlet while `pattern` matches the current URL.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param view - The view to display while `pattern` matches the current URL.
     * @param extend - A callback that takes a router object. Use this to append nested routes and redirects.
     */
    addRoute<I>(pattern: string, view: ViewLike<I>, extend?: (sub: AppRouter) => void): this;

    /**
     * Adds a new pattern and chains a set of nested routes that are displayed without a layout `view`.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param view - Pass null to render subroutes without a parent view.
     * @param extend - A callback that takes a router object. Use this to append nested routes and redirects.
     */
    addRoute(pattern: string, view: null, extend: (sub: AppRouter) => void): this;

    /**
     * Adds a new pattern that will redirect to a different route when matched.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param redirectPath - A path to redirect to when `pattern` matches the current URL.
     */
    addRedirect(pattern: string, redirectPath: string): this;

    /**
     * Adds a new pattern that will redirect to a different route when matched, as calculated by a callback function.
     * Useful when you require more insight into the path that matched the pattern before deciding where to send the user.
     *
     * @param pattern - A URL pattern to match against the current URL.
     * @param createPath - A function that generates a redirect path from the current URL match.
     */
    addRedirect(pattern: string, createPath: (ctx: RedirectContext) => string): this;
  }

  interface RedirectContext {
    /**
     * The path as it appears in the URL bar.
     */
    path: string;

    /**
     * The pattern that this path was matched with.
     */
    pattern: string;

    /**
     * Named route params parsed from `path`.
     */
    params: Record<string, string | number | undefined>;

    /**
     * Query params parsed from `path`.
     */
    query: Record<string, string | number | undefined>;
  }

  /*==================================*\
  ||           Debug Context          ||
  \*==================================*/

  type DebugChannel = {
    name: string;

    /**
     * Log the arguments to the console.
     */
    log(...args: any[]): void;

    /**
     * Log the arguments to the console as a warning.
     */
    warn(...args: any[]): void;

    /**
     * Log the arguments to the console as an error.
     */
    error(...args: any[]): void;
  };

  /*==================================*\
  ||            Observables            ||
  \*==================================*/

  export abstract class Observable<Value> {
    subscribe(observer: Observer<Value>): Subscription;

    subscribe(next?: (value: Value) => void, error?: (err: Error) => void, complete?: () => void): Subscription;
  }

  export interface Observer<Value> {
    next(value: Value): void;
  }

  export interface Subscription {
    unsubscribe(): void;
  }

  /*==================================*\
  ||          State / Bindings        ||
  \*==================================*/

  export class State<T> extends Observable<T> implements Writable<T> {
    static isReadable<P>(value: unknown): value is Readable<P>;
    static isWritable<P>(value: unknown): value is Writable<P>;
    static isState<P>(value: unknown): value is State<P>;

    constructor(initialValue: T): State<T>;
    constructor(): State<T | undefined>;

    /**
     * Returns the current value.
     */
    get(): T;

    /**
     * Returns a new state whose value reflects the value of this state when passed through a `transform` function.
     *
     * @param transform - Function to convert the value of the current state into the value of a new state.
     */
    map<R>(transform: (value: T) => R): Readable<R>;

    /**
     * Assigns a new value to the bound state.
     *
     * @param value - New value.
     */
    set(value: T): void;

    /**
     * Assigns a new value to the bound state through a callback function that takes the current value and returns a new one.
     */
    update(callback: (value: T) => T): void;

    /**
     * Assigns a new value to the bound state through a callback function that takes the current value and mutates it to the desired value.
     */
    update(callback: (value: T) => void): void;

    /**
     * Creates a new read-only binding to this value.
     */
    readable(): Readable<T>;

    /**
     * Subscribes to multiple observables, passing the values of each to a callback that returns the resulting value of a new state.
     *
     * @param observable
     * @param callback
     */
    static merge<
      O extends [...Observable<any>],
      V = { [K in keyof O]: O[K] extends Observable<infer U> ? U : never },
      R
    >(observables: [...O], callback: (...values: V) => R): Readable<R>;
  }

  export interface Writable<T> extends Readable<T> {
    /**
     * Assigns a new value to the bound state.
     *
     * @param value - New value.
     */
    set(value: T): void;

    /**
     * Assigns a new value to the bound state through a callback function that takes the current value and returns a new one.
     */
    update(callback: (value: T) => T): void;

    /**
     * Assigns a new value to the bound state through a callback function that takes the current value and mutates it to the desired value.
     */
    update(callback: (value: T) => void): void;

    /**
     * Creates a new read-only binding to this value.
     */
    readable(): Readable<T>;
  }

  export interface Readable<T> extends Observable<T> {
    /**
     * Returns the current value.
     */
    get(): T;

    /**
     * Returns a new state whose value reflects the return value of `transform` when called with this state's value.
     *
     * @param transform - Function to convert the value of the current state into the value of a new state.
     */
    map<R>(transform: (value: T) => R): Readable<R>;
  }

  /**
   * Context for stateful objects like views and globals.
   */
  interface StateContext {
    /**
     * Subscribes to an observable while this view is connected.
     *
     * @param observable - An Observable object compatible with the TC39 Observables spec. This can be a state binding or an observable from another library like RxJS.
     * @param next - Callback to receive `next` values from the observable.
     * @param error - Callback to receive `error` values from the observable.
     * @param complete - Callback to receive the `complete` signal from the observable.
     *
     * @see https://github.com/tc39/proposal-observable
     */
    subscribe<T>(
      observable: Observable<T>,
      next?: (value: T) => void,
      error?: (err: Error) => void,
      complete?: () => void
    ): void;

    /**
     * Subscribes to multiple observables, passing the values of each to a callback when changes occur.
     *
     * @param observable
     * @param callback
     */
    subscribe<O extends [...Observable<any>], V = { [K in keyof O]: O[K] extends Observable<infer U> ? U : never }>(
      observables: [...O],
      callback: (...values: V) => void
    ): void;
  }

  /*==================================*\
  ||               View               ||
  \*==================================*/

  /* ----- Templating ----- */

  interface Connectable {
    readonly node: Node;
    readonly isConnected: boolean;

    connect(parent: Node, after?: Node): Promise<void>;
    disconnect(): Promise<void>;
  }

  interface ElementContext {
    isSVG: boolean;
    stores: Map<StoreConstructor<any> | string, StoreConfig<any>>;
  }

  interface MarkupConfig {
    appContext: any;
    elementContext?: ElementContext;
  }

  interface Markup {
    init(config: MarkupConfig): Connectable;
  }

  interface ToStringable {
    toString(): string;
  }

  export type Renderable = Markup | ToStringable | Observable<ToStringable>;

  /**
   * Creates an instance of an HTML element or view.
   */
  interface MarkupFn {
    <Tag extends keyof JSX.IntrinsicElements>(
      tag: Tag,
      attributes: JSX.IntrinsicElements[Tag],
      ...children: Renderable[]
    ): Markup;

    (tag: string, attributes: Record<string, any>, ...children: Renderable[]): Markup;

    (tag: string, ...children: Renderable[]): Markup;

    (view: View<any>, ...children: Renderable[]): Markup;

    <I>(view: View<I>, inputs: I, ...children: Renderable[]): Markup;
  }

  type InputsConfig<T = any> = {
    [name in keyof T]: {
      /**
       * Validates input value at runtime. The app will crash if `validate` returns false or throws an Error.
       */
      parse?: (value: unknown) => T[name];

      /**
       * An example value to show what this input might take.
       */
      example: T[name];

      /**
       * Attribute description for viewer.
       */
      about?: string;

      /**
       * The default value if the input is not passed.
       */
      default?: T[name];

      /**
       * Allows writing back to writable bindings to propagate changes up to a parent view. Also known as two-way binding.
       * All bindings are only readable by default.
       */
      writable?: boolean;

      /**
       * Allows a value to be omitted without defining a default value.
       */
      optional?: boolean;
    };
  };

  export type ViewLike<I> = ViewSetupFn<I> | View<I>;

  export type ViewSetupFn<I = any> = (ctx: ViewContext<I>, m: MarkupFn) => Markup | null;

  export type ViewConfig<I> = {
    /**
     * A name to identify this view in the console and dev tools.
     */
    label?: string;

    /**
     * An explanation of this view.
     */
    about?: string;

    /**
     * Values passed into this view, usually as HTML attributes.
     */
    inputs?: InputsConfig<I>;

    /**
     * Returns elements to display while `setup` returns a pending Promise.
     */
    loading?: (m: MarkupFn) => Markup;

    /**
     * Configures the view and returns elements to display.
     */
    setup: ViewSetupFn<I>;
  };

  type RepeatSetupFn<T> = (ctx: ViewContext<{ item: T; index: number }>) => Markup;

  export class View<I = any> extends Connectable {
    static define<T extends ViewConfig<any, any>, I = { [K in keyof T["inputs"]]: T["inputs"][K] }>(
      config: ViewConfig<I>
    ): View<I>;

    static isView<I = any>(value: unknown): value is View<I>;

    /**
     * Displays `element` when `value` is truthy.
     */
    static when(value: Observable<any>, element: Renderable): Markup;

    /**
     * Displays `element` when `value` is truthy and `otherwise`... otherwise.
     */
    static when(value: Observable<any>, element: Renderable, otherwise: Renderable): Markup;

    /**
     * Displays `element` when `value` is falsy.
     */
    static unless(value: Observable<any>, element: Renderable): Markup;

    /**
     * Repeats an element for each item in `value`. Value must be iterable.
     * The `render` function takes bindings to the item and index and returns an element to render.
     */
    static repeat<T>(
      value: T[] | Observable<T[]>,
      setup: RepeatSetupFn<T>,
      key?: (value: T, index: number) => any
    ): Markup;

    /**
     * Subscribes to an observable, passing each new value to a callback that returns content to render.
     *
     * NOTE: This tears down and rebuilds DOM nodes each and every time the value changes.
     *
     * @param observable
     * @param callback
     */
    static subscribe<T>(observable: Observable<T>, callback: (value: T) => Renderable | null): Markup;

    /**
     * Subscribes to multiple observables, passing the values of each to a callback that returns content to render.
     *
     * NOTE: This tears down and rebuilds DOM nodes each and every time an observable's value changes.
     *
     * @param observable
     * @param callback
     */
    static subscribe<
      O extends [...Observable<any>],
      V = { [K in keyof O]: O[K] extends Observable<infer U> ? U : never }
    >(observables: [...O], callback: (...values: V) => Renderable | null): Markup;

    constructor(config: ViewConfig<I>);

    context: ViewContext<I>;

    /**
     * Fake type for JSX attribute checking.
     */
    ___inputs: {
      [K in keyof I]: I[K] | Readable<I[K]>;
    };
  }

  interface Inputs<T> extends Readable<T> {
    get<K extends keyof T>(key: K): T[K];
    get(): T;

    set<K extends keyof T>(key: K, value: T[K]): void;
    set(values: Partial<T>): void;

    update(fn: (value: T) => void | T): void;

    readable<K extends keyof T>(key: K): Readable<T[K]>;
    readable(): Readable<T>;

    writable<K extends keyof T>(key: K): Writable<T[K]>;
    writable(): Writable<T>;
  }

  export interface ViewContext<I = any> extends StateContext, DebugChannel {
    /**
     * True while this view is connected to the DOM.
     */
    readonly isConnected: boolean;

    inputs: Inputs<I>;

    useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
    useStore<S extends Store<any>>(store: S): S extends Store<unknown, infer U> ? U : unknown;
    useStore<S extends StoreConstructor<any>>(store: S): S extends StoreConstructor<any, infer U> ? U : unknown;

    /**
     * Registers a callback to run after the component is connected to the DOM.
     */
    onConnect(callback: () => void): void;

    /**
     * Registers a callback to run after the component is removed from the DOM.
     */
    onDisconnect(callback: () => void): void;

    /**
     * Implements logic for an enter transition that is considered settled when the promise resolves.
     * `afterConnect` is not fired until `animateIn` resolves.
     */
    animateIn(callback: () => Promise<void>): void;

    /**
     * Implements logic for an animation that is considered settled when the promise resolves.
     * DOM node is not disconnected until `animateOut` resolves.
     */
    animateOut(callback: () => Promise<void>): void;

    /**
     * Displays nested content where it is called.
     */
    outlet(): Markup;
  }

  /*==================================*\
  ||              Stores              ||
  \*==================================*/

  interface StoreConstructor<I, E> {
    new (): Store<I, E>;
  }

  type StoreSetupFn<I, E> = (ctx: StoreContext<I>) => E;

  export class Store<I = any, Exports = any> {
    static define<
      T extends StoreConfig<any, any>,
      I = { [K in keyof T["inputs"]]: T["inputs"][K] },
      E = ReturnType<T["setup"]>
    >(config: StoreConfig<I, E>): Store<I, E>;

    constructor(config: StoreConfig<I, Exports>);

    setup(ctx: StoreContext<I>): Exports;
  }

  export interface StoreContext<I> extends DebugChannel, StateContext {
    inputs: Inputs<I>;

    useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
    useStore<S extends Store<unknown, unknown>>(store: S): S extends Store<unknown, infer U> ? U : unknown;
    useStore<S extends StoreConstructor<any>>(store: S): S extends StoreConstructor<any, infer U> ? U : unknown;

    /**
     * Registers a callback to run after the store is connected.
     */
    onConnect: (callback: () => void) => void;

    /**
     * Registers a callback to run after the store is disconnected.
     */
    onDisconnect: (callback: () => void) => void;
  }

  export type StoreConfig<I, E> = {
    /**
     * A name to identify this store in the console and dev tools.
     */
    label?: string;

    /**
     * An explanation of this store.
     */
    about?: string;

    /**
     * Values passed into this store, usually as HTML attributes.
     */
    inputs?: InputsConfig<I>;

    /**
     * Configures the store and returns object to export.
     */
    setup: StoreSetupFn<I, E>;
  };

  /*==================================*\
  ||          Built-in Stores         ||
  \*==================================*/

  type DialogStore = {
    open<Attrs extends DialogViewAttrs>(view: View<Attrs>, options?: DialogOptions<Attrs>): Dialog<Attrs>;
    open<Attrs extends DialogViewAttrs>(fn: ViewSetupFn<Attrs>, options?: DialogOptions<Attrs>): Dialog<Attrs>;
  };

  type RouterStore = {
    $pattern: Readable<string>;
    $path: Readable<string>;
    $params: Readable<{ [name: string]: unknown }>;
    $$query: Writable<{ [name: string]: unknown }>;

    back: (steps?: number) => void;
    forward: (steps?: number) => void;
    navigate: (path: string, options?: { replace?: boolean }) => void;
  };

  type HTTPStore = {
    /**
     * Add middleware to the HTTP service for all requests.
     * Middleware can intercept outgoing requests and modify incoming responses.
     *
     * @param middleware - Async middleware function.
     */
    use(middleware: HTTPMiddleware): HTTPStore;

    /**
     * Make an HTTP request to `url` with any `method`.
     *
     * @param method - HTTP method.
     * @param url - Request endpoint.
     */
    request<ResBody, ReqBody = any>(
      method: string,
      url: string,
      options?: HTTPRequestOptions<ReqBody>
    ): HTTPRequest<ResBody>;

    /**
     * Make an HTTP `GET` request to `url`.
     *
     * @param url - Request endpoint.
     */
    get<ResBody = any>(url: string, options?: HTTPRequestOptions<void>): HTTPRequest<ResBody>;

    /**
     * Make an HTTP `PUT` request to `url`.
     *
     * @param url - Request endpoint.
     */
    put<ResBody = any, ReqBody = any>(url: string, options?: HTTPRequestOptions<ReqBody>): HTTPRequest<ResBody>;

    /**
     * Make an HTTP `PATCH` request to `url`.
     *
     * @param url - Request endpoint.
     */
    patch<ResBody = any, ReqBody = any>(url: string, options?: HTTPRequestOptions<ReqBody>): HTTPRequest<ResBody>;

    /**
     * Make an HTTP `POST` request to `url`.
     *
     * @param url - Request endpoint.
     */
    post<ResBody = any, ReqBody = any>(url: string, options?: HTTPRequestOptions<ReqBody>): HTTPRequest<ResBody>;

    /**
     * Make an HTTP `DELETE` request to `url`.
     *
     * @param url - Request endpoint.
     */
    delete<ResBody = any>(url: string, options?: HTTPRequestOptions<void>): HTTPRequest<ResBody>;

    /**
     * Make an HTTP `HEAD` request to `url`.
     *
     * @param url - Request endpoint.
     */
    head(url: string, options?: HTTPRequestOptions): HTTPRequest<void>;

    /**
     * Make an HTTP `OPTIONS` request to `url`.
     *
     * @param url - Request endpoint.
     */
    options(url: string, options?: HTTPRequestOptions): HTTPRequest<void>;
  };

  type PageStore = {
    $$title: Writable<string>;
    $visibility: Readable<"visible" | "hidden">;
    $orientation: Readable<"landscape" | "portrait">;
    $colorScheme: Readable<"light" | "dark">;
  };

  type LanguageStore = {
    $currentLanguage: Readable<string>;
    supportedLanguages: string[];
    setLanguage(tag: string): Promise<void>;
    translate(key: string, values?: Record<string, any>): Readable<string>;
  };

  export type BuiltInStores = {
    dialog: DialogStore;
    router: RouterStore;
    http: HTTPStore;
    page: PageStore;
    language: LanguageStore;
  };

  /* ----- Dialog ----- */

  export interface DialogViewAttrs {
    /**
     * Controls the dialog's open state. When this is true the dialog is displayed. When false the dialog is hidden.
     */
    open: boolean;
  }

  export type DialogOptions<Attrs> = {
    inputs?: Partial<Omit<Attrs, "open">>;
  };

  export type Dialog<Attrs> = {
    close: () => void;
  };

  /* ----- HTTP ----- */

  type HTTPStoreAttrs = {
    fetch: typeof window.fetch;
  };

  type HTTPRequestOptions<ReqBody> = {
    body: ReqBody;
    query: Record<string, ToStringable>;
    headers: Record<string, ToStringable>;
  };

  type HTTPResponse<BodyType> = {
    url: string;
    method: string;
    status: number;
    statusText: string;
    headers: {
      [name: string]: string;
    };
    body: BodyType;
  };

  type HTTPMiddleware = <ResBody>(req: HTTPRequest<ResBody>, next: () => Promise<void>) => Promise<void>;

  interface HTTPRequest<ResBody> extends Promise<HTTPResponse<ResBody>> {
    /**
     * True if this request is to a URL relative to the current page.
     */
    readonly isSameDomain: boolean;

    /**
     * Gets the current request URL.
     */
    getURL(): string;

    /**
     * Sets the request URL.
     */
    setURL(url: string): this;

    /**
     * Gets the current header value by name.
     */
    getHeader(name: string): string | undefined;

    /**
     * Sets the value of the header with name `name` to `value`.
     * If `value` is null the header is removed.
     */
    setHeader(name: string, value: ToStringable | null): this;

    /**
     * Clears the value of the header with name `name`.
     */
    setHeader(name: string, value: null): this;

    getHeaders(): Record<string, string>;

    /**
     * Sets multiple headers at once using an object.
     * Merge values with existing headers.
     */
    setHeaders(headers: { [name: string]: string }): this;

    getQuery(): Record<string, string>;

    /**
     * Returns the value of the query param with name `name`.
     */
    getQuery(name: string): string | undefined;

    /**
     * Sets the value of the query param with name `name` to `value`.
     * If `value` is null the query param is removed.
     */
    setQuery(name: string, value: ToStringable | null): this;

    /**
     * Sets multiple query params at once using an object.
     * New values are merged with existing params.
     */
    setQuery(params: { [name: string]: ToStringable | null }): this;

    getBody(): any;

    /**
     * Sets the request body to `value`.
     */
    setBody(value: any): this;

    /**
     * Defines a check for whether the response code indicates an error or success.
     * If this function returns false for a status code, it will be thrown as an error.
     */
    checkOk(check: (res: HTTPResponse<ResBody>) => boolean): this;

    /**
     * Returns the response object (if there is one).
     */
    getResponse(): HTTPResponse<ResBody> | undefined;
  }

  /*==================================*\
  ||                Ref               ||
  \*==================================*/

  export class Ref<T> {
    constructor(): Ref<T | undefined>;
    constructor(initialValue: T): Ref<T>;

    element: T;
  }

  /*==================================*\
  ||         Animations: Spring       ||
  \*==================================*/

  export interface SpringOptions {
    mass?: number;
    stiffness?: number;
    damping?: number;
    velocity?: number;
  }

  export class Spring extends Readable<number> {
    constructor(initialValue: number, options?: SpringOptions);

    snapTo(endValue: number): Promise<void>;
    to(endValue: number, options?: SpringOptions): Promise<void>;
    animate(startValue: number, endValue: number, options?: SpringOptions): Promise<void>;
  }
}

declare module "woofe/viewer" {
  import { ViewLike, GlobalLike } from "woofe";

  export interface ViewerConfig<A = any> {
    globals?: { name: string; global: GlobalLike }[];
    // locals?: {name: string, local: Local}[],
    presets: {
      name: string;
      attributes?: A;
      globals: { name: string; global: GlobalLike }[];
    }[];
  }

  export interface Viewer {
    config: ViewerConfig;
    // TODO: Instantiate and connect, select preset, etc.
    // This object will be used by the viewer runner.
  }

  export function makeViewer<A>(view: ViewLike<A>, config?: ViewerConfig<A>): Viewer;
}

declare module "@borf/browser/jsx-runtime" {
  import { Blueprint, View } from "@borf/browser";

  export function jsx(
    element: string | View<any, any>,
    props: { [name: string]: any; children: Blueprint },
    key: any
  ): Blueprint;

  export function jsxs(
    element: string | View<any, any>,
    props: { [name: string]: any; children: Blueprint[] },
    key: any
  ): Blueprint;
}

declare module "@borf/browser/jsx-dev-runtime" {
  import { Blueprint, View } from "@borf/browser";

  export function jsxDEV(
    element: string | View<any, any>,
    props: { [name: string]: any; children: Blueprint | Blueprint[] },
    key: any,
    isStaticChildren: boolean,
    source: any,
    self: any
  ): Blueprint;
}

declare namespace JSX {
  import { Observable, Ref, ToStringable } from "@borf/browser";
  import * as CSS from "csstype";

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }

  interface ElementAttributesProperty {
    ___inputs;
  }

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

  /**
   * Events supported by all HTML elements.
   */
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
     * The `touchcancel` event is fired when one or more touch points have been disrupted in an
     * implementation-specific manner (for example, too many touch points are created).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/touchcancel_event
     */
    ontouchcancel: EventHandler<TouchEvent>;

    /**
     * The `touchend` event fires when one or more touch points are removed from the touch surface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/touchend_event
     */
    ontouchend: EventHandler<TouchEvent>;

    /**
     * The `touchstart` event is fired when one or more touch points are placed on the touch surface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/touchstart_event
     */
    ontouchstart: EventHandler<TouchEvent>;

    /**
     * The `touchmove` event is fired when one or more touch points are moved along the touch surface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/touchmove_event
     */
    ontouchmove: EventHandler<TouchEvent>;

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
     * For TypeScript support; child elements passed through JSX.
     */
    children?: any;

    /**
     * A binding that receives a reference to the DOM element.
     */
    ref?: Ref<any>;
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
     * Authors are strongly encouraged to window the `div` element as an element of last resort,
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

  interface AnchorElementAttributes extends ElementAttributes<HTMLAnchorElement> {
    /**
     * A hyperlink address. Must be a valid URL potentially surrounded by spaces.
     *
     * @see https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element
     */
    href?: MaybeObservable<string | undefined>;

    /**
     * Where to display the linked URL, as the name for a browsing context (a tab, window, or `<iframe>`)
     *
     * A common usage is `target: "_blank"` to cause a link to open in a new tab.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target
     */
    target?: MaybeObservable<"_self" | "_blank" | "parent" | "_top" | undefined>;

    /**
     * Causes the browser to treat the linked URL as a download. Can be used with or without a value.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download
     */
    download?: MaybeObservable<string | undefined>;

    /**
     * A space-separated list of URLs. When the link is followed, the browser will send `POST` requests with the body PING to the URLs.
     * Typically for tracking.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-ping
     */
    ping?: MaybeObservable<string | undefined>;

    /**
     * The relationship of the linked URL as space-separated [link types](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-hreflang
     */
    rel?: MaybeObservable<string | undefined>;

    /**
     * Hints at the human language of the linked URL. No built-in functionality.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-hreflang
     */
    hreflang?: MaybeObservable<string | undefined>;

    /**
     * Hints at the linked URL's format with a [MIME type](https://developer.mozilla.org/en-US/docs/Glossary/MIME_type). No built-in functionality.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-type
     */
    type?: MaybeObservable<string | undefined>;

    /**
     * How much of the [referrer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
     * to send when following the link.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-referrerpolicy
     */
    referrerpolicy?: MaybeObservable<
      | "no-referrer"
      | "no-referrer-when-downgrade"
      | "origin"
      | "origin-when-cross-origin"
      | "same-origin"
      | "strict-origin"
      | "strict-origin-when-cross-origin"
      | "unsafe-url"
      | undefined
    >;
  }

  interface EmElementAttributes extends ElementAttributes<HTMLElement> {}

  interface StrongElementAttributes extends ElementAttributes<HTMLElement> {}

  interface SmallElementAttributes extends ElementAttributes<HTMLElement> {}

  interface SElementAttributes extends ElementAttributes<HTMLElement> {}

  interface CiteElementAttributes extends ElementAttributes<HTMLElement> {}

  interface QElementAttributes extends ElementAttributes<HTMLElement> {}

  interface DfnElementAttributes extends ElementAttributes<HTMLElement> {}

  interface AbbrElementAttributes extends ElementAttributes<HTMLElement> {
    /**
     * Provides an expansion for the abbreviation or acronym when a full expansion is not present.
     * This provides a hint to user agents on how to announce/display the content while informing all users what the abbreviation means.
     * If present, `title` must contain this full description and nothing else.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
     */
    title?: MaybeObservable<string | undefined>;
  }

  interface RubyElementAttributes extends ElementAttributes<HTMLElement> {}

  interface RtElementAttributes extends ElementAttributes<HTMLElement> {}

  interface RpElementAttributes extends ElementAttributes<HTMLElement> {}

  interface DataElementAttributes extends ElementAttributes<HTMLDataElement> {
    /**
     * Specifies the machine-readable translation of the content of the element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
     */
    value?: MaybeObservable<any>;
  }

  interface TimeElementAttributes extends ElementAttributes<HTMLTimeElement> {
    /**
     * Indicates the time and/or date of the element. Must be in one of the formats below:
     *
     *
     * a valid year string
     * ```
     * 2011
     * ```
     *
     * a valid month string
     * ```
     * 2011-11
     * ```
     *
     * a valid date string
     * ```
     * 2011-11-18
     * ```
     *
     * a valid yearless date string
     * ```
     * 11-18
     * ```
     *
     * a valid week string
     * ```
     * 2011-W47
     * ```
     *
     * a valid time string
     * ```
     * 14:54
     * 14:54:39
     * 14:54:39.929
     * ```
     *
     * a valid local date and time string
     * ```
     * 2011-11-18T14:54:39.929
     * 2011-11-18 14:54:39.929
     * ```
     *
     * a valid global date and time string
     * ```
     * 2011-11-18T14:54:39.929Z
     * 2011-11-18T14:54:39.929-0400
     * 2011-11-18T14:54:39.929-04:00
     * 2011-11-18 14:54:39.929Z
     * 2011-11-18 14:54:39.929-0400
     * 2011-11-18 14:54:39.929-04:00
     * ```
     *
     * a valid duration string
     * ```
     * PT4H18M3S
     * ```
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
     */
    datetime?: MaybeObservable<string | undefined>;
  }

  interface CodeElementAttributes extends ElementAttributes<HTMLElement> {}

  interface VarElementAttributes extends ElementAttributes<HTMLElement> {}

  interface SampElementAttributes extends ElementAttributes<HTMLElement> {}

  interface KbdElementAttributes extends ElementAttributes<HTMLElement> {}

  interface SubElementAttributes extends ElementAttributes<HTMLElement> {}

  interface SupElementAttributes extends ElementAttributes<HTMLElement> {}

  interface IElementAttributes extends ElementAttributes<HTMLElement> {}

  interface BElementAttributes extends ElementAttributes<HTMLElement> {}

  interface UElementAttributes extends ElementAttributes<HTMLElement> {}

  interface MarkElementAttributes extends ElementAttributes<HTMLElement> {}

  interface BdiElementAttributes extends ElementAttributes<HTMLElement> {
    /**
     * Directionality of the text inside the `<bdi>` element. Can be `rtl` for languages read right-to-left and `ltr` for languages read left-to-right. Defaults to `auto`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
     */
    dir?: MaybeObservable<"auto" | "rtl" | "ltr" | undefined>;
  }

  interface BdoElementAttributes extends ElementAttributes<HTMLElement> {
    /**
     * Directionality of the text inside the `<bdo>` element. Can be `rtl` for languages read right-to-left and `ltr` for languages read left-to-right. Defaults to `auto`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
     */
    dir?: MaybeObservable<"auto" | "rtl" | "ltr" | undefined>;
  }

  interface SpanElementAttributes extends ElementAttributes<HTMLSpanElement> {}

  interface BrElementAttributes extends ElementAttributes<HTMLBRElement> {}

  interface WbrElementAttributes extends ElementAttributes<HTMLElement> {}

  interface IntrinsicElements {
    /**
     * Creates a hyperlink to web pages, files, email addresses, locations in the same page, or anything else a URL can address.
     *
     * Content within each `<a>` should indicate the link's destination.
     * If the `href` attribute is present, pressing the enter key while focused on the `<a>` element will activate it.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
     */
    a: AnchorElementAttributes;

    /**
     * Marks text that has stress emphasis. The `<em>` element can be nested, each level of nesting indicating a greater degree of emphasis.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em
     */
    em: EmElementAttributes;

    /**
     * Indicates that its contents have strong importance, seriousness, or urgency. Browsers typically render the contents in bold type.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong
     */
    strong: StrongElementAttributes;

    /**
     * Represents side-comments and small print, like copyright and legal text.
     * Renders text within it one font-size smaller, such as from `small` to `x-small`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small
     */
    small: SmallElementAttributes;

    /**
     * Renders text with a strikethrough, or a line through it. Use the `<s>` element to represent things that are no longer relevant or no longer accurate.
     * However, `<s>` is not appropriate when indicating document edits; for that, use the `<del>` and `<ins>` elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s
     */
    s: SElementAttributes;

    /**
     * Used to describe a reference to a cited creative work, and must include the title of that work.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite
     */
    cite: CiteElementAttributes;

    /**
     * indicates that the enclosed text is a short inline quotation. Most modern browsers implement this by surrounding the text in quotation marks.
     * For long quotations with paragraph breaks use the `<blockquote>` element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
     */
    q: QElementAttributes;

    /**
     * Used to indicate the term being defined within the context of a definition phrase or sentence.
     * The `<p>` element, the `<dt>`/`<dd>` pairing, or the `<section>` element which is the nearest ancestor of the `<dfn>` is considered to be the definition of the term.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn
     */
    dfn: DfnElementAttributes;

    /**
     * Indicates an abbreviation or acronym. Provide a full expansion of the term in plain text on first use, along with the `<abbr>` to mark up the abbreviation.
     * This informs the user what the abbreviation or acronym means.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
     */
    abbr: AbbrElementAttributes;

    /**
     * Represents small annotations that are rendered above, below, or next to base text, usually used for showing the pronunciation of East Asian characters.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
     */
    ruby: RubyElementAttributes;

    /**
     * Specifies the ruby text component of a ruby annotation, which is used to provide pronunciation, translation,
     * or transliteration information for East Asian typography. The `<rt>` element must always be contained within a `<ruby>` element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt
     */
    rt: RtElementAttributes;

    /**
     * Provide a fall-back parentheses for browsers that do not support display of ruby annotations using the `<ruby>` element.
     * One `<rp>` element should contain the `<rt>` element that contains the annotation's text.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp
     */
    rp: RpElementAttributes;

    /**
     * Wraps a piece of content, providing an additional machine-readable version in a `value` attribute.
     * For date or time related data, a `<time>` element is preferred.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
     */
    data: DataElementAttributes;

    /**
     * Represents a specific period in time. It may include the `datetime` attribute to translate dates into machine-readable format,
     * allowing for better search engine results or custom features such as reminders.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
     */
    time: TimeElementAttributes;

    /**
     * Displays its contents styled in a fashion intended to indicate that the text is a short fragment of computer code.
     * By default, the content text is displayed using a monospace font.
     *
     * You can display larger, multi-line `<code>` snippets by wrapping them with `<pre>` tags to keep the original line breaks.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code
     */
    code: CodeElementAttributes;

    /**
     * Represents the name of a variable in a mathematical expression or a programming context.
     * Represented in italics by default in most browsers.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var
     */
    var: VarElementAttributes;

    /**
     * Represents `<samp>`le output from a computer program. Displayed with a monospace font by default.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp
     */
    samp: SampElementAttributes;

    /**
     * Represents text a user would input with keyboard, voice, or another text entry device.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd
     */
    kbd: KbdElementAttributes;

    /**
     * Represents a superscript (like the 2 in E=mc2).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup
     */
    sup: SupElementAttributes;

    /**
     * Represents a subscript (like the 2 in H2O).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub
     */
    sub: SubElementAttributes;

    /**
     * The _idiomatic text_ element.
     *
     * Represents a range of text that is set off from the normal text for some reason, such as idiomatic text,
     * technical terms, taxonomical designations, among others. Historically, these have been presented using italicized type,
     * which is the original source of the `<i>` naming of this element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i
     */
    i: IElementAttributes;

    /**
     * The _Bring Attention To_ element.
     *
     * Draws the reader's attention to the element's contents, which are not otherwise granted special importance.
     * This was formerly known as the Boldface element, and most browsers still draw the text in boldface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b
     */
    b: BElementAttributes;

    /**
     * The _Unarticulated Annotation_ (Underline) element.
     *
     * Represents a span of inline text which should be rendered in a way that indicates that it has a non-textual annotation.
     * This is rendered by default as a simple solid underline.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
     */
    u: UElementAttributes;

    /**
     * The _Mark Text_ element.
     *
     * Represents text which is marked or highlighted for reference or notation purposes,
     * due to the marked passage's relevance or importance in the enclosing context.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark
     */
    mark: MarkElementAttributes;

    /**
     * The _Bidirectional Isolate__ element.
     *
     * Tells the browser's bidirectional algorithm to treat the text it contains in isolation from its surrounding text.
     * It's particularly useful when a website dynamically inserts some text and doesn't know the directionality of the text being inserted.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
     */
    bdi: BdiElementAttributes;

    /**
     * The _Bidirectional Text Override_ element.
     *
     * Overrides the current directionality of text, so that the text within is rendered in a different direction.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
     */
    bdo: BdoElementAttributes;

    /**
     * The _Content Span_ element.
     *
     * A generic inline container for phrasing content, which does not inherently represent anything.
     * It can be used to group elements for styling purposes (using the `class` or `id` attributes),
     * or because they share attribute values, such as `lang`. It should be used only when no other semantic element
     * is appropriate. `<span>` is very much like a `<div>` element, but `<div>` is a block-level element
     * whereas `<span>` is an inline element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
     */
    span: SpanElementAttributes;

    /**
     * The _Line Break_ element.
     *
     * Produces a line break (carriage-return) in text. HTML does not preserve line breaks outside a `<pre>` or element
     * with similar CSS, but they can be explicitly represented with a `<br>` element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
     */
    br: BrElementAttributes;

    /**
     * The _Line Break Opportunity_ element.
     *
     * Represents a word break opportunity—a position within text where the browser may optionally break a line,
     * though its line-breaking rules would not otherwise create a break at that location.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
     */
    wbr: WbrElementAttributes;
  }

  /*====================================*\
  || 4.6                          Links ||
  \*====================================*/

  // --- This is just about <a> and <area> attributes in the spec.

  /*====================================*\
  || 4.7                          Edits ||
  \*====================================*/

  interface ModElementAttributes extends ElementAttributes<HTMLModElement> {
    /**
     * A URL pointing to content that explains this change.
     * User agents may allow users to follow such citation links, but they are primarily intended for private use
     * (e.g., by server-side scripts collecting statistics about a site's edits), not for readers.
     */
    cite?: MaybeObservable<string | undefined>;

    /**
     * Indicates the time and/or date of the element. Must be in one of the formats below:
     *
     *
     * a valid year string
     * ```
     * 2011
     * ```
     *
     * a valid month string
     * ```
     * 2011-11
     * ```
     *
     * a valid date string
     * ```
     * 2011-11-18
     * ```
     *
     * a valid yearless date string
     * ```
     * 11-18
     * ```
     *
     * a valid week string
     * ```
     * 2011-W47
     * ```
     *
     * a valid time string
     * ```
     * 14:54
     * 14:54:39
     * 14:54:39.929
     * ```
     *
     * a valid local date and time string
     * ```
     * 2011-11-18T14:54:39.929
     * 2011-11-18 14:54:39.929
     * ```
     *
     * a valid global date and time string
     * ```
     * 2011-11-18T14:54:39.929Z
     * 2011-11-18T14:54:39.929-0400
     * 2011-11-18T14:54:39.929-04:00
     * 2011-11-18 14:54:39.929Z
     * 2011-11-18 14:54:39.929-0400
     * 2011-11-18 14:54:39.929-04:00
     * ```
     *
     * a valid duration string
     * ```
     * PT4H18M3S
     * ```
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
     */
    datetime?: MaybeObservable<string | undefined>;
  }

  interface InsElementAttributes extends ModElementAttributes {}

  interface DelElementAttributes extends ModElementAttributes {}

  interface IntrinsicElements {
    /**
     * The _Inserted Text_ element.
     *
     * Represents a range of text that has been added to a document. You can use the `<del>` element to similarly
     * represent a range of text that has been deleted from the document.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
     */
    ins: InsElementAttributes;

    /**
     * The _Deleted Text_ element.
     *
     * Represents a range of text that has been deleted from a document. This can be used when blueprints "track changes"
     * or source code diff information, for example. The `<ins>` element can be used for the opposite purpose: to indicate
     * text that has been added to the document.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
     */
    del: DelElementAttributes;
  }

  /*====================================*\
  || 4.8               Embedded Content ||
  \*====================================*/

  // picture
  // source
  // img
  // iframe
  // embed
  // object
  // video
  // audio
  // track
  // map
  // area

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
     * For example, it is fired when playback resumes after having been paused or delayed due to lack of data.
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

  interface HTMLMediaElementAttributes<T extends HTMLElement> extends ElementAttributes<T>, HTMLMediaElementEvents {}

  interface PictureElementAttributes extends ElementAttributes<HTMLPictureElement> {}

  interface SourceElementAttributes extends ElementAttributes<HTMLSourceElement> {
    /**
     * The [MIME type](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types) of the resource,
     * optionally with a [`codecs` parameter](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter).
     */
    type?: MaybeObservable<string | undefined>;

    /**
     * URL of the media resource.
     *
     * Required if the source element's parent is an `<audio>` or `<video>` element, not allowed for `<picture>` elements.
     */
    src?: MaybeObservable<string | undefined>;

    /**
     * A list of one or more strings, separated by commas, indicating a set of possible images represented by the source for the browser to use.
     *
     * Required if the source element's parent is a `<picture>` element, not allowed for `<audio>` or `<video>` elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-srcset
     */
    srcset?: MaybeObservable<string | undefined>;

    /**
     * A list of source sizes that describes the final width of the image. Each source size consists of a comma-separated
     * list of media condition-length pairs. This information is used by the browser to determine, before laying the page out,
     * which image defined in `srcset` to use. Please note that `sizes` will have its effect only if width dimension
     * descriptors are provided with `srcset` instead of pixel ratio values (`200w` instead of `2x` for example).
     *
     * Allowed if the source element's parent is a `<picture>` element, not allowed for `<audio>` or `<video>` elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-sizes
     */
    sizes?: MaybeObservable<string | undefined>;

    /**
     * Media query of the resource's intended media.
     *
     * Allowed if the source element's parent is a `<picture>` element, not allowed for `<audio>` or `<video>` elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-media
     */
    media?: MaybeObservable<string | undefined>;

    /**
     * The intrinsic height of the image, in pixels. Must be an integer without a unit.
     *
     * Allowed if the source element's parent is a `<picture>` element, not allowed for `<audio>` or `<video>` elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-height
     */
    height?: MaybeObservable<string | number | undefined>;

    /**
     * The intrinsic width of the image, in pixels. Must be an integer without a unit.
     *
     * Allowed if the source element's parent is a `<picture>` element, not allowed for `<audio>` or `<video>` elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-width
     */
    width?: MaybeObservable<string | number | undefined>;
  }

  interface ImgElementAttributes extends ElementAttributes<HTMLImageElement> {
    /**
     * Defines an alternative text description of the image.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-alt
     */
    alt?: MaybeObservable<string | undefined>;

    /**
     * Indicates if the fetching of the image must be done using a CORS request.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-crossorigin
     */
    crossorigin?: MaybeObservable<"anonymous" | "use-credentials" | undefined>;

    /**
     * Provides an image decoding hint to the browser.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-decoding
     */
    decoding?: MaybeObservable<"sync" | "async" | "auto" | undefined>;

    /**
     * Provides a hint of the relative priority to use when fetching the image.
     *
     * @experimental
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-fetchpriority
     */
    fetchpriority?: MaybeObservable<"high" | "low" | "auto" | undefined>;

    /**
     * The intrinsic height of the image, in pixels. Must be an integer without a unit.
     */
    height?: MaybeObservable<string | number | undefined>;

    /**
     * The intrinsic width of the image, in pixels. Must be an integer without a unit.
     */
    width?: MaybeObservable<string | number | undefined>;

    /**
     * Indicates that the image is part of a [server-side map](https://en.wikipedia.org/wiki/Image_map#Server-side).
     * If so, the coordinates where the user clicked on the image are sent to the server.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-ismap
     */
    ismap?: MaybeObservable<boolean | undefined>;

    /**
     * Indicates how the browser should load the image.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-loading
     */
    loading?: MaybeObservable<"eager" | "lazy" | undefined>;

    /**
     * A string indicating which referrer to use when fetching the resource.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-referrerpolicy
     */
    referrerpolicy?: MaybeObservable<
      | "no-referrer"
      | "no-referrer-when-downgrade"
      | "origin"
      | "origin-when-cross-origin"
      | "same-origin"
      | "strict-origin"
      | "strict-origin-when-cross-origin"
      | "unsafe-url"
      | undefined
    >;

    /**
     * One or more strings separated by commas, indicating a set of source sizes.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-sizes
     */
    sizes?: MaybeObservable<string | undefined>;

    /**
     * The image URL. Required.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-src
     */
    src: MaybeObservable<string>;

    /**
     * One or more strings separated by commas, indicating possible image sources for the user agent to use.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-srcset
     */
    srcset?: MaybeObservable<string | undefined>;

    /**
     * The partial URL (starting with #) of an [image map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map)
     * associated with the element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-usemap
     */
    usemap?: MaybeObservable<string | undefined>;
  }

  interface IframeElementAttributes extends ElementAttributes<HTMLIFrameElement> {
    /**
     * Specifies a [feature policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy) for the `<iframe>`.
     * The policy defines what features are available to the `<iframe>` based on the origin of the request
     * (e.g. access to the microphone, camera, battery, web-share API, etc.).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
     */
    allow?: MaybeObservable<string | undefined>;

    /**
     * A [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) enforced for the embedded resource.
     * See [HTMLIFrameElement.csp](https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/csp) for details.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-csp
     */
    csp?: MaybeObservable<string | undefined>;

    /**
     * Provides a hint of the relative priority to use when fetching the iframe document.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-fetchpriority
     */
    fetchpriority?: MaybeObservable<"high" | "low" | "auto" | undefined>;

    /**
     * The height of the frame in CSS pixels. Default is `150`.
     */
    height?: MaybeObservable<string | number | undefined>;

    /**
     * The width of the frame in CSS pixels. Default is `300`.
     */
    width?: MaybeObservable<string | number | undefined>;

    /**
     * Indicates how the browser should load the iframe.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-loading
     */
    loading?: MaybeObservable<"eager" | "lazy" | undefined>;

    /**
     * A targetable name for the embedded browsing context. This can be used in the `target` attribute of the
     * `<a>`, `<form>`, or `<base>` elements; the `formtarget` attribute of the `<input>` or `<button>` elements;
     * or the `windowName` parameter in the [`window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-name
     */
    name?: MaybeObservable<string | undefined>;

    /**
     * A string indicating which referrer to use when fetching the resource.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-referrerpolicy
     */
    referrerpolicy?: MaybeObservable<
      | "no-referrer"
      | "no-referrer-when-downgrade"
      | "origin"
      | "origin-when-cross-origin"
      | "same-origin"
      | "strict-origin"
      | "strict-origin-when-cross-origin"
      | "unsafe-url"
      | undefined
    >;

    /**
     * Applies extra restrictions to the content in the frame. The value of the attribute can either be empty to apply
     * all restrictions, or [space-separated tokens to lift particular restrictions](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox).
     */
    sandbox?: MaybeObservable<string | undefined>;

    /**
     * The URL of the page to embed.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-src
     */
    src?: MaybeObservable<string | undefined>;

    /**
     * Inline HTML to embed, overriding the `src` attribute. If a browser does not support the `srcdoc` attribute,
     * it will fall back to the URL in the `src` attribute.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-srcdoc
     */
    srcdoc?: MaybeObservable<string | undefined>;
  }

  interface EmbedElementAttributes extends ElementAttributes<HTMLEmbedElement> {
    /**
     * The displayed height of the resource, in CSS pixels. This must be an absolute value; percentages are not allowed.
     */
    height?: MaybeObservable<string | number | undefined>;

    /**
     * The displayed width of the resource, in CSS pixels. This must be an absolute value; percentages are not allowed.
     */
    width?: MaybeObservable<string | number | undefined>;

    /**
     * The URL of the resource being embedded.
     */
    src?: MaybeObservable<string | undefined>;

    /**
     * The [MIME type](https://developer.mozilla.org/en-US/docs/Glossary/MIME_type) to use to select the plug-in to instantiate.
     */
    type?: MaybeObservable<string | undefined>;
  }

  interface ObjectElementAttributes extends ElementAttributes<HTMLObjectElement> {
    /**
     * The displayed height of the resource, in CSS pixels. This must be an absolute value; percentages are not allowed.
     */
    height?: MaybeObservable<string | number | undefined>;

    /**
     * The displayed width of the resource, in CSS pixels. This must be an absolute value; percentages are not allowed.
     */
    width?: MaybeObservable<string | number | undefined>;

    /**
     * The address of the resource as a valid URL. At least one of `data` and `type` must be defined.
     */
    data?: MaybeObservable<string | undefined>;

    /**
     * The [MIME type](https://developer.mozilla.org/en-US/docs/Glossary/MIME_type) of the resource specified by data.
     * At least one of `data` and `type` must be defined.
     */
    type?: MaybeObservable<string | undefined>;

    /**
     * The form element, if any, that the object element is associated with (its form owner).
     * The value of the attribute must be an ID of a `<form>` element in the same document.
     */
    form?: MaybeObservable<string | undefined>;

    /**
     * The name of valid browsing context (HTML5), or the name of the control (HTML 4).
     */
    name?: MaybeObservable<string | undefined>;

    /**
     * A hash-name reference to a `<map>` element; that is a '#' followed by the value of a name of a map element.
     */
    usemap?: MaybeObservable<string | undefined>;
  }

  interface VideoElementAttributes extends HTMLMediaElementAttributes<HTMLVideoElement> {
    /**
     * If specified, the video automatically begins to play back as soon as it can do so without stopping to finish loading the data.
     *
     * In some browsers (e.g. Chrome 70.0) autoplay doesn't work if no `muted` attribute is present.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-autoplay
     */
    autoplay?: MaybeObservable<boolean | undefined>;

    /**
     * If this attribute is present, the browser will offer controls to allow the user to control video playback,
     * including volume, seeking, and pause/resume playback.
     */
    controls?: MaybeObservable<boolean | undefined>;

    /**
     * Indicates whether to use CORS to fetch the related video. If not present, the resource is fetched without
     * a CORS request.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin
     */
    crossorigin?: MaybeObservable<"anonymous" | "use-credentials" | undefined>;

    /**
     * The height of the video's display area, in CSS pixels. This must be an absolute value; percentages are not allowed.
     */
    height?: MaybeObservable<string | number | undefined>;

    /**
     * The width of the video's display area, in CSS pixels. This must be an absolute value; percentages are not allowed.
     */
    width?: MaybeObservable<string | number | undefined>;

    /**
     * If true, the browser will automatically seek back to the start upon reaching the end of the video.
     */
    loop?: MaybeObservable<boolean | undefined>;

    /**
     * Indicates whether the audio will be initially silenced. Its default value is `false`.
     */
    muted?: MaybeObservable<boolean | undefined>;

    /**
     * Indicates that the video is to be played "inline", that is within the element's playback area.
     * Note that the absence of this attribute does not imply that the video will always be played in fullscreen.
     */
    playsinline?: MaybeObservable<boolean | undefined>;

    /**
     * A URL for an image to be shown while the video is downloading. If this attribute isn't specified, nothing is
     * displayed until the first frame is available, then the first frame is shown as the poster frame.
     */
    poster?: MaybeObservable<string | undefined>;

    /**
     * Provides a hint to the browser about what the author thinks will lead to the best user experience regarding
     * what content is loaded before the video is played.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-preload
     */
    preload?: MaybeObservable<"none" | "metadata" | "auto" | "" | undefined>;

    /**
     * The URL of the content to embed. This is optional; you may instead use the `<source>` element within the
     * `<video>` element to specify the video to embed.
     */
    src?: MaybeObservable<string | undefined>;
  }

  interface AudioElementAttributes extends HTMLMediaElementAttributes<HTMLAudioElement> {
    /**
     * If specified, the audio will automatically begin playback as soon as it can do so, without waiting for the
     * entire audio file to finish downloading.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-autoplay
     */
    autoplay?: MaybeObservable<boolean | undefined>;

    /**
     * If this attribute is present, the browser will offer controls to allow the user to control audio playback,
     * including volume, seeking, and pause/resume playback.
     */
    controls?: MaybeObservable<boolean | undefined>;

    /**
     * Indicates whether to use CORS to fetch the related audio file. If not present, the resource is fetched without
     * a CORS request.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin
     */
    crossorigin?: MaybeObservable<"anonymous" | "use-credentials" | undefined>;

    /**
     * If true, the audio player will automatically seek back to the start upon reaching the end of the audio.
     */
    loop?: MaybeObservable<boolean | undefined>;

    /**
     * Indicates whether the audio will be initially silenced. Its default value is `false`.
     */
    muted?: MaybeObservable<boolean | undefined>;

    /**
     * Provides a hint to the browser about what the author thinks will lead to the best user experience regarding
     * what content is loaded before the audio is played.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-preload
     */
    preload?: MaybeObservable<"none" | "metadata" | "auto" | "" | undefined>;

    /**
     * The URL of the audio to embed. This is optional; you may instead use the `<source>` element within the
     * `<audio>` element to specify the video to embed.
     */
    src?: MaybeObservable<string | undefined>;
  }

  interface TrackElementAttributes extends ElementAttributes<HTMLTrackElement> {
    /**
     * Indicates that the track should be enabled unless the user's preferences indicate that another track
     * is more appropriate. This may only be used on one track element per media element.
     */
    default?: MaybeObservable<boolean | undefined>;

    /**
     * How the text track is meant to be used. If omitted the default kind is `subtitles`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#attr-kind
     */
    kind?: MaybeObservable<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata" | undefined>;

    /**
     * A user-readable title of the text track which is used by the browser when listing available text tracks.
     */
    label?: MaybeObservable<string | undefined>;

    /**
     * Address of the track (`.vtt` file). Must be a valid URL. This attribute must be specified and its URL value
     * must have the same origin as the document — unless the `<audio>` or `<video>` parent element of the track
     * element has a `crossorigin` attribute.
     */
    src: MaybeObservable<string>;

    /**
     * Language of the track text data. It must be a valid [BCP 47 language tag](https://r12a.github.io/app-subtags/).
     * If the `kind` attribute is set to `subtitles`, then `srclang` must be defined.
     */
    srclang: MaybeObservable<string | undefined>;
  }

  interface MapElementAttributes extends ElementAttributes<HTMLMapElement> {
    /**
     * Gives the map a name so that it can be referenced. The attribute must be present and must have a non-empty value
     * with no space characters. The value of the name attribute must not be equal to the value of the name attribute
     * of another `<map>` element in the same document. If the `id` attribute is also specified, both attributes must
     * have the same value.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map#attr-name
     */
    name: MaybeObservable<string>;
  }

  interface AreaElementAttributes extends ElementAttributes<HTMLAreaElement> {
    /**
     * A text string alternative to display on browsers that do not display images. The text should be phrased
     * so that it presents the user with the same kind of choice as the image would offer when displayed without
     * the alternative text. This attribute is required only if the `href` attribute is used.
     */
    alt?: MaybeObservable<string | undefined>;

    /**
     * The shape of the associated hot spot.
     */
    shape?: MaybeObservable<"rect" | "circle" | "poly" | "default" | undefined>;

    /**
     * Details the coordinates of the `shape` attribute in size, shape, and placement of an `<area>`.
     * This attribute must not be used if `shape` is set to `default`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-coords
     */
    coords?: MaybeObservable<string | undefined>;

    /**
     * If present, indicates that the author intends the hyperlink to be used for downloading a resource.
     * See `<a>` for [a full description of the `download` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download).
     */
    download?: MaybeObservable<string | undefined>;

    /**
     * The hyperlink target for the area. Its value is a valid URL. This attribute may be omitted; if so,
     * the `<area>` element does not represent a hyperlink.
     */
    href?: MaybeObservable<string | undefined>;

    /**
     * Contains a space-separated list of URLs to which, when the hyperlink is followed, `POST` requests with the body
     * `PING` will be sent by the browser (in the background). Typically used for tracking.
     */
    ping?: MaybeObservable<string | undefined>;

    /**
     * A string indicating which referrer to use when fetching the resource.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-referrerpolicy
     */
    referrerpolicy?: MaybeObservable<
      | "no-referrer"
      | "no-referrer-when-downgrade"
      | "origin"
      | "origin-when-cross-origin"
      | "same-origin"
      | "strict-origin"
      | "strict-origin-when-cross-origin"
      | "unsafe-url"
      | undefined
    >;

    /**
     * For anchors containing the `href` attribute, this attribute specifies the relationship of the target object
     * to the link object. The value is a space-separated list of [link types values](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types).
     * The values and their semantics will be registered by some authority that might have meaning to the document author.
     * The default relationship, if no other is given, is void. Use this attribute only if the `href` attribute is present.
     */
    rel?: MaybeObservable<string | undefined>;

    /**
     * Where to display the linked URL, as the name for a browsing context (a tab, window, or `<iframe>`)
     *
     * A common usage is `target: "_blank"` to cause a link to open in a new tab.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-target
     */
    target?: MaybeObservable<"_self" | "_blank" | "parent" | "_top" | undefined>;
  }

  interface IntrinsicElements {
    /**
     * The _Picture_ element.
     *
     * Contains zero or more `<source>` elements and one `<img>` element to offer alternative versions of an image
     * for different display/device scenarios.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
     */
    picture: PictureElementAttributes;

    /**
     * The _Media or Image Source_ element.
     *
     * Specifies multiple media resources for a `<picture>`, `<audio>` or `<video>` element. Commonly used to offer
     * the same media content in multiple file formats in order to provide compatibility with a broad range of browsers.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
     */
    source: SourceElementAttributes;

    /**
     * The _Image Embed_ element.
     *
     * Embeds an image into the document.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
     */
    img: ImgElementAttributes;

    /**
     * The _Inline Frame_ element.
     *
     * Represents a nested [browsing context](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context),
     * embedding another HTML page into the current one.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
     */
    iframe: IframeElementAttributes;

    /**
     * The _Embed External Content_ element.
     *
     * Embeds external content at the specified point in the document. This content is provided by an external
     * application or other source of interactive content such as a browser plug-in.
     *
     * Most modern browsers have deprecated and removed support for browser plug-ins, so relying upon `<embed>`
     * is generally not wise if you want your site to be operable on the average user's browser.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
     */
    embed: EmbedElementAttributes;

    /**
     * The _External Object_ element.
     *
     * Represents an external resource, which can be treated as an image, a nested browsing context,
     * or a resource to be handled by a plugin.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
     */
    object: ObjectElementAttributes;

    /**
     * The _Video Embed_ element.
     *
     * Embeds a video player. You can use `<video>` for audio content as well,
     * but the `<audio>` element may provide a more appropriate user experience.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
     */
    video: VideoElementAttributes;

    /**
     * The _Embed Audio_ element.
     *
     * Embeds an audio player. It may contain one or more audio sources, represented using the `src` attribute or the
     * `<source>` element: the browser will choose the most suitable one.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
     */
    audio: AudioElementAttributes;

    /**
     * The _Embed Text Track_ element.
     *
     * Provides subtitles or other time-based data to a parent `<video>` or `<audio>` element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
     */
    track: TrackElementAttributes;

    /**
     * The _Image Map_ element.
     *
     * Used with `<area>` elements to define an image map. An image map allows geometric areas on an image to be
     * associated with links.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
     */
    map: MapElementAttributes;

    /**
     * The _Image Map Area_ element.
     *
     * Defines an area inside an image map that has predefined clickable areas. An image map allows geometric areas
     * on an image to be associated with links.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
     */
    area: AreaElementAttributes;
  }

  /*====================================*\
  || 4.9                   Tabular Data ||
  \*====================================*/

  // table
  // caption
  // colgroup
  // col
  // tbody
  // thead
  // tfoot
  // tr
  // td
  // th

  interface TableElementAttributes extends ElementAttributes<HTMLTableElement> {}

  interface TableCaptionElementAttributes extends ElementAttributes<HTMLTableCaptionElement> {}

  interface TableColgroupElementAttributes extends ElementAttributes<HTMLTableColElement> {
    /**
     * A positive integer indicating the number of consecutive columns the `<colgroup>` element spans.
     * If not present, its default value is `1`.
     *
     * The `span` attribute is not permitted if there are one or more `<col>` elements within the `<colgroup>`.
     */
    span?: MaybeObservable<number | undefined>;
  }

  interface TableColElementAttributes extends ElementAttributes<HTMLTableColElement> {
    /**
     * A positive integer indicating the number of consecutive columns the `<col>` element spans.
     * If not present, its default value is `1`.
     */
    span?: MaybeObservable<number | undefined>;
  }

  interface TableBodyElementAttributes extends ElementAttributes<HTMLTableSectionElement> {}

  interface TableHeadElementAttributes extends ElementAttributes<HTMLTableSectionElement> {}

  interface TableFootElementAttributes extends ElementAttributes<HTMLTableSectionElement> {}

  interface TableRowElementAttributes extends ElementAttributes<HTMLTableRowElement> {}

  interface TableCellElementAttributes extends ElementAttributes<HTMLTableCellElement> {
    /**
     * A positive integer value that indicates for how many columns the cell extends. Its default value is `1`.
     * Values higher than 1000 will be considered as incorrect and will be set to the default value.
     */
    colspan?: MaybeObservable<number | undefined>;

    /**
     * A non-negative integer value that indicates for how many rows the cell extends. Its default value is `1`;
     * if its value is set to `0`, it extends until the end of the table section (`<thead>`, `<tbody>`, `<tfoot>`,
     * even if implicitly defined), that the cell belongs to.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-rowspan
     */
    rowspan?: MaybeObservable<number | undefined>;

    /**
     * A list of space-separated strings, each corresponding to the `id` attribute of the `<th>` elements that apply to this element.
     */
    headers?: MaybeObservable<string | undefined>;
  }

  interface TableHeaderElementAttributes extends TableCellElementAttributes {
    /**
     * A short abbreviated description of the cell's content. Some user-agents, such as speech readers, may present this description before the content itself.
     */
    abbr?: MaybeObservable<string | undefined>;

    /**
     * Defines the cells that the `<th>` element relates to.
     *
     * - `row`: The header relates to all cells of the row it belongs to.
     * - `col`: The header relates to all cells of the column it belongs to.
     * - `rowgroup`: The header belongs to a rowgroup and relates to all of its cells. These cells can be placed to the
     *    right or the left of the header, depending on the value of the `dir` attribute in the `<table>` element.
     * - `colgroup`: The header belongs to a colgroup and relates to all of its cells.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-scope
     */
    scope?: MaybeObservable<"row" | "col" | "rowgroup" | "colgroup" | undefined>;
  }

  interface IntrinsicElements {
    /**
     * The _Table_ element.
     *
     * Represents tabular data — that is, information presented in a two-dimensional table comprised of rows and columns
     * of cells containing data.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
     */
    table: TableElementAttributes;

    /**
     * The _Table Caption_ element.
     *
     * Specifies the caption (or title) of a table.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
     */
    caption: TableCaptionElementAttributes;

    /**
     * The _Table Column Group_ element.
     *
     * Defines a group of columns within a table.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
     */
    colgroup: TableColgroupElementAttributes;

    /**
     * The _Table Column_ element.
     *
     * Defines a column within a table and is used for defining common semantics on all common cells.
     * It is generally found within a `<colgroup>` element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
     */
    col: TableColElementAttributes;

    /**
     * The _Table Body_ element.
     *
     * Encapsulates a set of table rows (`<tr>` elements), indicating that they comprise the body of the table (`<table>`).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
     */
    tbody: TableBodyElementAttributes;

    /**
     * The _Table Head_ element.
     *
     * Defines a set of rows defining the head of the columns of the table.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
     */
    thead: TableHeadElementAttributes;

    /**
     * The _Table Foot_ element.
     *
     * Defines a set of rows summarizing the columns of the table.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
     */
    tfoot: TableFootElementAttributes;

    /**
     * The _Table Row_ element.
     *
     * Defines a row of cells in a table. The row's cells can then be established using a mix of `<td>` (data cell)
     * and `<th>` (header cell) elements.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
     */
    tr: TableRowElementAttributes;

    /**
     * The _Table Data Cell_ element.
     *
     * Defines a cell of a table that contains data.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
     */
    td: TableCellElementAttributes;

    /**
     * The _Table Header_ element.
     *
     * Defines a cell as header of a group of table cells. The exact nature of this group is defined by the
     * `scope` and `headers` attributes.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
     */
    th: TableHeaderElementAttributes;
  }

  /*====================================*\
  || 4.10                         Forms ||
  \*====================================*/

  // form
  // label
  // input
  // button
  // select
  // datalist
  // optgroup
  // option
  // textarea
  // output
  // progress
  // meter
  // fieldset
  // legend

  interface FormElementAttributes extends ElementAttributes<HTMLFormElement> {
    /**
     * Indicates whether input elements can by default have their values automatically completed by the browser.
     * `autocomplete` attributes on form elements override it on `<form>`.
     *
     * @see \https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-autocomplete
     */
    autocomplete?: MaybeObservable<"off" | "on" | undefined>;

    /**
     * The `name` of the form. The value must not be the empty string, and must be unique among the form elements
     * in the forms collection that it is in, if any.
     */
    name?: MaybeObservable<string | undefined>;

    rel?: MaybeObservable<string | undefined>;

    /**
     * The URL that handles the form submission.
     */
    action?: MaybeObservable<string | undefined>;

    /**
     * The [MIME type](https://en.wikipedia.org/wiki/Media_type) of the form data, when the form has a `method` of `post`.
     */
    enctype?: MaybeObservable<"application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain" | undefined>;

    /**
     * The HTTP method to use when submitting the form. A value of `"dialog"` is valid when the form is inside a `<dialog`>
     * element, where it will close the dialog and fire a `submit` event without sending data or clearing the form.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-method
     */
    method?: MaybeObservable<"post" | "POST" | "get" | "GET" | "dialog" | undefined>;

    /**
     * If true, prevents the form from being validated when submitted.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-novalidate
     */
    novalidate?: MaybeObservable<boolean | undefined>;

    /**
     * Name of the browsing context to display the response to the form's submission.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-target
     */
    target?: MaybeObservable<"_self" | "_blank" | "_parent" | "_top" | string | undefined>;
  }

  interface LabelElementAttributes extends ElementAttributes<HTMLLabelElement> {
    /**
     * An `id` for the element the `<label>` labels.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#attr-for
     */
    for?: MaybeObservable<string | undefined>;
  }

  interface InputElementAttributes extends ElementAttributes<HTMLInputElement> {}

  interface ButtonElementAttributes extends ElementAttributes<HTMLButtonElement> {}

  interface SelectElementAttributes extends ElementAttributes<HTMLSelectElement> {}

  interface DatalistElementAttributes extends ElementAttributes<HTMLDataListElement> {}

  interface OptgroupElementAttributes extends ElementAttributes<HTMLOptGroupElement> {}

  interface OptionElementAttributes extends ElementAttributes<HTMLOptionElement> {}

  interface TextareaElementAttributes extends ElementAttributes<HTMLTextAreaElement> {}

  interface OutputElementAttributes extends ElementAttributes<HTMLOutputElement> {}

  interface ProgressElementAttributes extends ElementAttributes<HTMLProgressElement> {}

  interface MeterElementAttributes extends ElementAttributes<HTMLMeterElement> {
    /**
     * The current value displayed by this meter. Must be between `min` and `max`, which default to 0 and 1 respectively.
     */
    value?: MaybeObservable<number | undefined>;

    /**
     * The minimum value this meter can display. Defaults to 0.
     */
    min?: MaybeObservable<number | undefined>;

    /**
     * The maximum value this meter can display. Defaults to 1.
     */
    max?: MaybeObservable<number | undefined>;

    /**
     * If `value` is between `min` and `low` it is considered "low". You would charge your phone
     * if your battery meter was in this range. The browser may display values in this range in red.
     */
    low?: MaybeObservable<number | undefined>;

    /**
     * If `value` is between `high` and `max` it is considered "high". You just took your phone off the charger
     * if your battery meter is in this range. The browser may display values in this range in green.
     */
    high?: MaybeObservable<number | undefined>;

    /**
     * The ideal `value`.
     */
    optimum?: MaybeObservable<number | undefined>;
  }

  interface FieldsetElementAttributes extends ElementAttributes<HTMLFieldSetElement> {
    /**
     * If true, all form controls inside this fieldset are disabled.
     */
    disabled?: MaybeObservable<boolean | undefined>;

    // This may be the worst attribute I've ever heard of. Not sure it's worth adding.
    // form?: MaybeObservable<string | undefined>;

    /**
     * The name of this group of inputs.
     */
    name?: MaybeObservable<string | undefined>;
  }

  interface LegendElementAttributes extends ElementAttributes<HTMLLegendElement> {}

  interface IntrinsicElements {
    /**
     * Contains a group of interactive elements for taking input from a user.
     * This can be anything from a chat box with a submit button to a full page tax form.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
     */
    form: FormElementAttributes;

    /**
     * Provides a text label that describes another element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
     */
    label: LabelElementAttributes;

    /**
     * Displays
     */
    progress: ProgressElementAttributes;

    /**
     * Displays a value within a finite range. Think gas gauge or progress bar.
     * Consider the simpler [`<progress>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) element for progress bars.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
     */
    meter: MeterElementAttributes;

    /**
     * Contains and names a group of related form controls.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
     */
    fieldset: FieldsetElementAttributes;

    /**
     * Provides a caption for a parent `<fieldset>`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
     */
    legend: LegendElementAttributes;
  }

  /*====================================*\
  || 4.11          Interactive elements ||
  \*====================================*/

  // details
  // summary
  // dialog

  interface DetailsElementAttributes extends ElementAttributes<HTMLDetailsElement> {
    /**
     * Indicates whether the contents of the <details> element are currently visible.
     * The details are shown when this attribute is true, hidden when false.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
     */
    open?: MaybeObservable<boolean | undefined>;

    /**
     * The `toggle` event is fired when the `open`/`closed` state of a `<details>` element is toggled.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement/toggle_event
     */
    ontoggle?: EventHandler<Event>;
  }

  interface SummaryElementAttributes extends ElementAttributes<HTMLElement> {}

  interface DialogElementAttributes extends ElementAttributes<HTMLDialogElement> {
    /**
     * Indicates that the dialog is active and can be interacted with. When the `open` attribute is not set, the dialog
     * shouldn't be shown to the user. It is recommended to use the `.show()` or `.showModal()` methods to render dialogs,
     * rather than the `open` attribute.
     */
    open?: MaybeObservable<boolean | undefined>;
  }

  interface IntrinsicElements {
    /**
     * The _Details disclosure_ element.
     *
     * Creates a disclosure widget in which information is visible only when the widget is toggled into an "open" state.
     * A summary or label must be provided using the `<summary>` element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
     */
    details: DetailsElementAttributes;

    /**
     * The _Disclosure Summary_ element.
     *
     * Specifies a summary, caption, or legend for a `<details>` element's disclosure box.
     * Clicking the `<summary>` element toggles the state of the parent `<details>` element open and closed.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
     */
    summary: SummaryElementAttributes;

    /**
     * The _Dialog_ element.
     *
     * Represents a dialog box or other interactive component, such as a dismissible alert, inspector, or subwindow.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
     */
    dialog: DialogElementAttributes;
  }

  /*====================================*\
  || 4.12                     Scripting ||
  \*====================================*/

  // UNSUPPORTED script
  // UNSUPPORTED noscript
  // UNSUPPORTED template
  // UNSUPPORTED slot

  interface CanvasElementAttributes extends ElementAttributes<HTMLCanvasElement> {
    /**
     * The width of the coordinate space in CSS pixels. Defaults to 300.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#attributes
     */
    width?: MaybeObservable<string | number | undefined>;

    /**
     * The height of the coordinate space in CSS pixels. Defaults to 150.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#attributes
     */
    height?: MaybeObservable<string | number | undefined>;
  }

  interface IntrinsicElements {
    /**
     * The _Graphics Canvas_ element.
     *
     * Use it with either the [canvas scripting API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
     * or the [WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) to draw graphics and animations.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
     */
    canvas: CanvasElementAttributes;
  }

  /*====================================*\
  ||                           Catchall ||
  \*====================================*/

  // Catchall allows any other tag. Useful for custom elements or future additions to HTML.
  interface IntrinsicElements {
    [tag: string]: any;
  }
}

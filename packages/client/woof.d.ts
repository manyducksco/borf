declare module "@manyducksco/woof" {
  interface AppOptions {
    /**
     * Use hash-based routing.
     */
    hash?: boolean;
  }

  class App {}

  /**
   * Creates a new app.
   *
   * @param options - Customize your app with an options object. `hash: true` for hash routing.
   */
  export default function (options?: AppOptions): App;

  export interface State<V> {
    /**
     * Returns the current value.
     */
    (): V;

    /**
     * Updates the value.
     */
    (value: V): void;

    /**
     * Subscribes to value changes. Returns a cancel function to unsubscribe.
     */
    (callback: (value: V) => void): () => void;
  }

  /**
   * Custom methods that are added to the state object.
   * Each one takes the current value and returns the new value.
   */
  export interface StateMethods<T> {
    [name: string]: (current: V, ...args: any[]) => V;
  }

  /**
   * Creates a get/set/listen function to track a variable.
   */
  export function state<V>(initialValue: V, methods?: StateMethods): State;

  export interface AppInfo {
    title: string;

    /**
     * Retrieves a service by name and returns it.
     */
    services(name: string): Service;
  }

  type HTTPRequestContext = {};

  type HTTPRequestOptions = {};

  class HTTPRequest {}

  type HTTPMiddleware = (ctx: HTTPRequestContext) => Promise<void>;

  export class HTTP {
    get(
      url: string,
      ...args: [...middleware: HTTPMiddleware[], options?: HTTPRequestOptions]
    ): HTTPRequest;
  }

  /**
   * Singleton to store shared state and methods between components.
   */
  export class Service {
    app: AppInfo;
    http: HTTP;

    /**
     * Called when service is first created.
     */
    init() {}
  }
}

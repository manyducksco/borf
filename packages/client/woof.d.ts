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
       * Determines which debug channels are printed.
       * Supports multiple filters with commas, prepended `-` to exclude a channel
       * and wildcards to match partial channels.
       *
       * @example
       * "*" // print everything
       * "woof:*" // display all woof internal logging
       * "-woof:http,component:*" // hide woof:http and display all channels starting with `component:`
       */
      filter?: string;
    };

    /**
     * Use hash-based routing.
     */
    hash?: boolean;
  }

  /**
   *
   */
  export class App {
    /**
     * Registers a service on the app. Services can be referenced on
     * Services and Components using `this.service(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - Service class. One instance will be created and shared.
     * @param options - Object to be passed to service.created() function when called.
     */
    service(name: string, service: Service, options: any): this;
  }

  /**
   * Creates a new app.
   *
   * @param options - Customize your app with an options object.
   */
  export default function (options?: AppOptions): App;

  /*==================================*\
  ||              State               ||
  \*==================================*/

  export interface State<Value> {
    /**
     * Returns the current value.
     */
    (): Value;

    /**
     * Updates the value.
     */
    (value: Value): void;

    /**
     * Subscribes to value changes. Returns a cancel function to unsubscribe.
     */
    (callback: (value: Value) => void): () => void;
  }

  /**
   * Custom methods that are added to the state object.
   * Each one takes the current value and returns the new value.
   */
  export interface StateMethods<Value> {
    [name: string]: (current: Value, ...args: any[]) => Value;
  }

  /**
   * Creates a get/set/listen function to track a variable.
   */
  export function state<Value>(
    initialValue: Value,
    methods?: StateMethods<Value>
  ): State<Value>;

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

    if(
      condition: State<any>,
      then: $Node | (() => $Node),
      otherwise?: $Node | (() => $Node)
    ): $Node;
  };

  /*==================================*\
  ||               HTTP               ||
  \*==================================*/

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

import type { DebugOptions } from "./DebugHub";
import type { Factory } from "../commonTypes";

import { Type } from "@borf/bedrock";
import { merge } from "../helpers/merge.js";
import { DebugHub } from "./DebugHub.js";
import { CrashCollector } from "./CrashCollector.js";
import { Router } from "./Router.js";
import { Store } from "./Store.js";

interface StoreInfo<E> {
  store: Factory<Store<E>>;
  instance?: Store<E>;
}

export interface AppContext {
  debugHub: DebugHub;
  crashCollector: CrashCollector;
  stores: Map<Factory<Store<unknown>>, StoreInfo<unknown>>;
}

/**
 * Options for initializing the app.
 */
interface AppOptions {
  debug?: DebugOptions;
}

/**
 * Options for starting the app.
 */
interface AppStartOptions {
  port?: number;
}

/**
 * Info returned once app has started.
 */
interface AppStartStats {
  /**
   * Local port on which the app is listening for HTTP requests.
   */
  port: number;

  /**
   * Total time taken for the app to fully initialize, in milliseconds.
   */
  startupTime: number;
}

type HTTPVerb = "GET" | "HEAD" | "PUT" | "PATCH" | "POST" | "DELETE" | "OPTIONS";

interface AddCORSOptions {
  allowOrigin?: string[];
  allowMethods?: HTTPVerb[];
  allowCredentials?: boolean; // Determines if Access-Control-Allow-Credentials is set
  allowHeaders?: string[]; // Access-Control-Allow-Headers. If not passed, defaults to the value of Access-Control-Request-Headers on the request
  exposeHeaders?: string[]; // Access-Control-Expose-Headers
  maxAge?: number; // (in seconds) Access-Control-Max-Age
}

interface AddStoreOptions {
  /**
   * If "app", the store is created at app start and lives for the life of the app.
   * If "request", a new instance is created for each request.
   */
  lifecycle?: "app" | "request";
}

export class App extends Router {
  #options = {
    debug: {
      filter: "*,-borf:*",
      log: "development",
      warn: "development",
      error: true,
    },
  };

  constructor(options?: AppOptions) {
    super();
    this.#options = merge(this.#options, options ?? {});
  }

  /**
   * Configure how the app handles CORS requests.
   */
  addCORS(options: AddCORSOptions) {
    return this;
  }

  /**
   * Sets a fallback file to serve when the server has no handlers for a route.
   * Usually this is the app's `index.html` which lets the browser attempt to handle those routes with client side routing.
   *
   * @param filename - The name of the file in your `static` directory to use as a fallback.
   */
  addFallback(filename = "index.html") {
    return this;
  }

  /**
   * Adds a new static directory from which to serve files.
   *
   * @param prefix - Route pattern under which to serve files from `source`.
   * @param filesDir - Directory on disk where files exist to be served from `prefix`.
   */
  addStaticFiles(prefix: string, filesDir: string) {
    return this;
  }

  addStore(store: unknown, options: AddStoreOptions) {
    return this;
  }

  async start(options?: AppStartOptions): Promise<AppStartStats> {
    Type.assert(
      options?.port || process.env.PORT,
      `Must provide a 'port' option or define a PORT environment variable.`
    );

    const now = performance.now();
    const port = options?.port || Number(process.env.PORT);

    // TODO: Initialize stores and HTTP server.

    return {
      port,
      startupTime: performance.now() - now,
    };
  }
}

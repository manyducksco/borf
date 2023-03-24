import type { DebugOptions } from "classes/DebugHub";
import type { Cache } from "classes/StaticCache";
import type { StoreConstructor, StoreRegistration } from "classes/Store";

import path from "node:path";
import { createServer } from "node:http";
import { Type } from "@borf/bedrock";
import { NoCache, StaticCache } from "../StaticCache.js";
import { merge } from "../../helpers/merge.js";
import { DebugHub } from "../DebugHub.js";
import { CrashCollector } from "../CrashCollector.js";
import { Router } from "../Router.js";
import { Store } from "../Store.js";

import { makeRequestListener, RequestListener } from "./makeRequestListener.js";

// TODO: Use project config output paths
const DEFAULT_STATIC_SOURCE = path.join(process.cwd(), "output/static");

export interface AppContext {
  debugHub: DebugHub;
  crashCollector: CrashCollector;
  staticCache: Cache;
  stores: Map<StoreConstructor<unknown>, StoreRegistration<unknown>>;
  corsOptions?: CORSOptions;
  fallback?: string;
  environment?: "development" | "production";
}

/**
 * Options for initializing the app.
 */
interface AppOptions {
  /**
   * Logging options.
   */
  debug?: DebugOptions;

  /**
   * Pass a value to override NODE_ENV environment variable.
   */
  environment?: "development" | "production";
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

interface CORSOptions {
  allowOrigin: string[];
  allowMethods: HTTPVerb[];
  allowCredentials: boolean; // Determines if Access-Control-Allow-Credentials is set
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
  #options: Required<AppOptions> = {
    debug: {
      filter: "*,-borf:*",
      log: "development",
      warn: "development",
      error: true,
    },
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
  };

  #server = createServer();
  #listener?: RequestListener;
  #corsEnabled = false;
  #corsOptions: CORSOptions = {
    allowOrigin: ["*"],
    allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowCredentials: false,
  };
  #isStarted = false;
  #stores = new Map<StoreConstructor<unknown>, StoreRegistration<unknown>>();
  #cache: Cache;
  #fallback?: string;

  get server() {
    return this.#server;
  }

  constructor(options?: AppOptions) {
    super();
    this.#options = merge(this.#options, options ?? {});

    if (this.#options.environment === "production") {
      this.#cache = new NoCache();
    } else {
      this.#cache = new StaticCache();
    }
  }

  /**
   * Configure how the app handles CORS requests.
   */
  addCORS(options?: Partial<CORSOptions>) {
    this.#corsEnabled = true;
    Object.assign(this.#corsOptions, options);

    return this;
  }

  /**
   * Sets a fallback file to serve when a route has no handlers.
   * Usually, this file is the app's `index.html` which lets the browser app attempt to handle it with client side routing.
   *
   * @param filename - The name of the file in your `static` directory to use as a fallback.
   */
  addFallback(filename = "index.html") {
    this.#fallback = filename;
    return this;
  }

  /**
   * Adds a new static directory from which to serve files.
   *
   * @param prefix - Route pattern under which to serve files from `source`.
   * @param filesDir - Directory on disk where files exist to be served from `prefix`.
   */
  addStaticFiles(prefix = "/", filesDir = DEFAULT_STATIC_SOURCE) {
    Type.assertString(prefix, "Expected prefix to be a string. Got type: %t, value: %v");
    Type.assertString(filesDir, "Expected filesDir to be a string. Got type: %t, value: %v");

    this.#cache.addEntry({ path: prefix, source: filesDir });
    return this;
  }

  addStore(store: StoreConstructor<unknown>, options: AddStoreOptions = {}) {
    Type.assertExtends(Store)(store);

    this.#stores.set(store, {
      store,
      lifecycle: options.lifecycle || "app",
      instance: undefined,
    });
    return this;
  }

  async start(options?: AppStartOptions): Promise<AppStartStats> {
    if (this.#isStarted) {
      throw new Error(`App is already started`);
    }

    Type.assert(
      options?.port || process.env.PORT,
      `Must provide a 'port' option or define a PORT environment variable.`
    );

    const now = performance.now();
    const port = options?.port || Number(process.env.PORT);

    const debugHub = new DebugHub(this.#options.debug);
    const crashCollector = new CrashCollector({
      onCrash: (entry) => {},
      onReport: (entry) => {},
      sendStackTrace: this.#options.environment === "development",
    });

    const appContext: AppContext = {
      debugHub,
      crashCollector,
      corsOptions: this.#corsEnabled ? this.#corsOptions : undefined,
      staticCache: this.#cache,
      fallback: this.#fallback,
      stores: this.#stores,
      environment: this.#options.environment,
    };

    // Initialize app-lifecycle stores.
    for (const config of this.#stores.values()) {
      if (config.lifecycle === "app") {
        const instance = new config.store({
          appContext,
          label: config.store.label || config.store.name,
          lifecycle: config.lifecycle,
        });

        config.instance = instance;
        await instance.connect();
      }
    }

    this.#listener = makeRequestListener(appContext, this);
    this.#server.addListener("request", this.#listener);

    return new Promise<AppStartStats>(async (resolve) => {
      this.#server.listen(port, () => {
        resolve({
          port,
          startupTime: performance.now() - now,
        });
      });
    });
  }

  async stop() {
    if (this.#listener) {
      this.#server.removeListener("request", this.#listener);
    }

    return new Promise((resolve) => {
      this.#server.once("close", resolve);
      this.#server.close();
    });
  }
}

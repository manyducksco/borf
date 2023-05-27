import type { DebugOptions } from "classes/DebugHub";
import type { Cache } from "classes/StaticCache";
import { type Store, type StoreControls, makeStore } from "../../component.js";

import path from "node:path";
import { createServer, type Server } from "node:http";
import { assert, assertString } from "@borf/bedrock";
import { NoCache, StaticCache } from "../StaticCache.js";
import { merge } from "../../helpers/merge.js";
import { DebugHub } from "../DebugHub.js";
import { CrashCollector } from "../CrashCollector.js";
import { Router } from "../Router.js";

import { makeRequestListener, type RequestListener } from "./makeRequestListener.js";

// TODO: Use project config output paths
const DEFAULT_STATIC_SOURCE = path.join(process.cwd(), "output/static");

export interface StoreRegistration<A> {
  store: Store<A, any>;

  /**
   * Store to return instead whenever `store` is requested.
   */
  inject?: Store<A, any>;

  attributes?: A;
  instance?: StoreControls;
}

export interface AppContext {
  debugHub: DebugHub;
  crashCollector: CrashCollector;
  staticCache: Cache;
  stores: Map<Store<any, any>, StoreRegistration<any>>;
  corsOptions?: CORSOptions;
  fallback?: string;
  mode?: "development" | "production";
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
  mode?: "development" | "production";
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

export class App extends Router {
  #options: Required<AppOptions> = {
    debug: {
      filter: "*,-borf:*",
      log: "development",
      warn: "development",
      error: true,
    },
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
  };

  #server: Server;
  #listener?: RequestListener;
  #corsOptions: CORSOptions = {
    allowOrigin: ["*"],
    allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowCredentials: false,
  };
  #isStarted = false;
  #stores = new Map<Store<any, any>, StoreRegistration<any>>();
  #cache: Cache;
  #appContext: AppContext;

  get server() {
    return this.#server;
  }

  constructor(options?: AppOptions) {
    super();
    this.#options = merge(this.#options, options ?? {});

    if (this.#options.mode === "production") {
      // TODO: Add a way to keep some static directories uncached.
      // Until then, all files are read from disk every time.
      this.#cache = new NoCache();
      // this.#cache = new StaticCache();
    } else {
      this.#cache = new NoCache();
    }

    const debugHub = new DebugHub(this.#options.debug);
    const crashCollector = new CrashCollector({
      onCrash: (entry) => {},
      onReport: (entry) => {},
      sendStackTrace: this.#options.mode === "development",
    });

    this.#appContext = {
      debugHub,
      crashCollector,
      staticCache: this.#cache,
      stores: this.#stores,
      mode: this.#options.mode,
    };

    this.#listener = makeRequestListener(this.#appContext, this);
    this.#server = createServer(this.#listener);
  }

  /**
   * Configure how the app handles CORS requests.
   */
  cors(options?: Partial<CORSOptions>) {
    this.#appContext.corsOptions = Object.assign({}, this.#appContext.corsOptions ?? this.#corsOptions, options);
    return this;
  }

  /**
   * Sets a fallback file to serve when a route has no handlers.
   * Usually, this file is the app's `index.html` which lets the browser app attempt to handle it with client side routing.
   *
   * @param filename - The name of the file in your `static` directory to use as a fallback.
   */
  fallback(filename = "index.html") {
    this.#appContext.fallback = filename;
    return this;
  }

  /**
   * Adds a new static directory from which to serve files.
   *
   * @param prefix - Route pattern under which to serve files from `source`.
   * @param filesDir - Directory on disk where files exist to be served from `prefix`.
   */
  static(prefix = "/", filesDir = DEFAULT_STATIC_SOURCE) {
    assertString(prefix, "Expected prefix to be a string. Got type: %t, value: %v");
    assertString(filesDir, "Expected filesDir to be a string. Got type: %t, value: %v");

    this.#cache.addEntry({ path: prefix, source: filesDir });
    return this;
  }

  store<A>(store: Store<A, any>, attributes?: A) {
    this.#stores.set(store, {
      store,
      attributes,
      instance: undefined,
    });
    return this;
  }

  async start(options?: AppStartOptions): Promise<AppStartStats> {
    if (this.#isStarted) {
      throw new Error(`App is already started`);
    }

    assert(options?.port || process.env.PORT, `Must provide a 'port' option or define a PORT environment variable.`);

    const now = performance.now();
    const port = options?.port || Number(process.env.PORT);

    for (const config of this.#stores.values()) {
      const instance = makeStore({
        appContext: this.#appContext,
        store: config.store,
        attributes: config.attributes ?? {},
      });

      config.instance = instance;
      await instance.connect();
    }

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

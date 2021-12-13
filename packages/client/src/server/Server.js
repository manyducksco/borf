import http from "http";
import fs from "fs";
import path from "path";
import callsite from "callsite";
import queryString from "query-string";
import { createRouter } from "../_helpers/routing";
import { isNumber, isObject, isFunction } from "../_helpers/typeChecking";

import Debug from "../main/services/@debug";

export class Server {
  #setup;
  #services = {};
  #router = createRouter();
  #server;
  #static;

  constructor(options = {}) {
    this.service("@debug", Debug, options.debug);
    this.#server = http.createServer(async (req, res) => {
      const method = req.method.toLowerCase();
      const { url, query } = queryString.parseUrl(req.url);

      const matched = this.#router.match(req.url, {
        filter(route) {
          console.log(route);
        },
      });

      if (matched) {
        // TODO: Finalize this object
        const ctx = {
          request: {
            url: req.url,
            method: req.method,
            headers: req.headers,
          },
          response: {
            status: 204,
            body: null,
          },
          set status(value) {
            this.response.status = value;
          },
          set body(value) {
            this.response.body = value;
            if (isObject(value) && this.response.headers) {
            }
          },
        };

        console.log(ctx);

        req.on("data", (chunk) => {
          console.log("BODY", chunk);
        });
      } else {
        if (this.#static && req.method === "GET") {
          const ext = path.extname(url).toLowerCase();

          if (ext === "") {
            fs.createReadStream(
              path.posix.join(this.#static, "index.html")
            ).pipe(res);
            return;
          }

          console.log("IS STATIC");
          const filePath = path.posix.join(this.#static, url);
          if (fs.existsSync(filePath)) {
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
          }
        }
      }
    });
  }

  /**
   * Takes a function that configures the server before it starts.
   * This function is called after services have been created
   *
   * If the function returns a Promise, the server will not be started until the Promise resolves.
   *
   * @param fn - App config function.
   */
  setup(fn) {
    this.#setup = async () => fn((name) => this.#getService(name));
  }

  /**
   * Serve static files from the given path.
   *
   * @param folder - Directory for static files
   */
  static(directory) {
    if (path.isAbsolute(directory)) {
      this.#static = directory;
    } else {
      const callerDir = path.dirname(callsite()[0].getFileName());
      this.#static = path.join(callerDir, directory);
    }
  }

  /**
   * Adds a route to the list for matching when the URL changes.
   *
   * @param path - Path to match before calling handlers.
   * @param handlers - One or more middleware or a Resource.
   */
  route(path, ...handlers) {
    // this.#routes.push({
    //   path,
    //   callback: () => {
    //     const router = this.#getService("@router");
    //     // TODO: Make this into generic @template service or something.
    //     const $ = makeDolla({
    //       getService: (name) => this.#getService(name),
    //       route: {
    //         params: router.params(),
    //         query: router.query(),
    //         path: router.path(),
    //         route: router.route(),
    //         wildcard: router.wildcard(),
    //       },
    //     });
    //     if (this.#mounted) {
    //       this.#mounted.$disconnect();
    //     }
    //     this.#mounted = $(component)();
    //     this.#mounted.$connect(this.#outlet);
    //   },
    // });
    // this.#router.on(path);
  }

  /**
   * Registers a service on the server. Services can be referenced on
   * Services and Resources using `this.service(name)`.
   *
   * @param name - Unique string to name this service.
   * @param service - Service class. One instance will be created and shared.
   * @param options - Object to be passed to service.created() function when called.
   */
  service(name, service, options) {
    if (!this.#services[name]) {
      this.#services[name] = {
        template: service,
        instance: null,
        options,
      };
    }

    // Merge with existing fields if overwriting.
    this.#services[name].template = service;

    if (options !== undefined) {
      this.#services[name].options = options;
    }
  }

  /**
   * Starts the server.
   *
   * @param port - Port number to bind to.
   */
  listen(port) {
    if (!isNumber(port)) {
      throw new TypeError(`Expected port number. Received: ${element}`);
    }

    for (const name in this.#services) {
      const service = this.#services[name];
      const instance = new service.template((name) => this.#getService(name));

      service.instance = instance;

      if (isFunction(instance._created)) {
        instance._created(service.options);
      }
    }

    const done = () => {
      this.#server.listen(port);

      console.log(`[woof:server] listening on port ${port}`);
    };

    if (this.#setup) {
      this.#setup().then(done);
    } else {
      done();
    }
  }

  #getService(name) {
    if (this.#services[name]) {
      return this.#services[name].instance;
    }

    throw new Error(`Service is not registered. Received: ${name}`);
  }
}

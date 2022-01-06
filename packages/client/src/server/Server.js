import http from "http";
import fs from "fs";
import path from "path";
import callsite from "callsite";
import queryString from "query-string";
import { isNumber, isObject, isFunction } from "../_helpers/typeChecking";

import Debug from "../main/services/@debug";
import { Router } from "./Router";

export class Server extends Router {
  #setup;
  #services = {};
  #static;

  constructor(options = {}) {
    this.service("@debug", Debug, options.debug);
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
      throw new TypeError(`Expected port number. Received: ${port}`);
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
      http.createServer(this.callback()).listen(port);

      console.log(`[woof:server] listening on port ${port}`);
    };

    if (this.#setup) {
      this.#setup().then(done);
    } else {
      done();
    }
  }

  /**
   * Returns an HTTP handler function for Node `http.createServer`
   */
  callback() {
    return async (req, res) => {
      const method = req.method.toLowerCase();
      const { url, query } = queryString.parseUrl(req.path);

      const matched = this.$match(method, path);

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
            fs.createReadStream(path.posix.join(this.#static, "index.html")).pipe(res);
            return;
          }

          const filePath = path.posix.join(this.#static, url);
          if (fs.existsSync(filePath)) {
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
          }
        }
      }
    };
  }

  #getService(name) {
    if (this.#services[name]) {
      return this.#services[name].instance;
    }

    throw new Error(`Service is not registered. Received: ${name}`);
  }
}

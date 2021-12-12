import { createRouter } from "../_helpers/routing";
import { isNumber, isObject } from "../_helpers/typeChecking";

import Debug from "../main/services/@debug";

// TODO: Finalize this object
const ctx = {
  request: {},
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

export class Server {
  #setup;
  #services = {};
  #router = createRouter();

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

    throw new Error(
      `Service is not registered on this server. Received: ${name}`
    );
  }
}

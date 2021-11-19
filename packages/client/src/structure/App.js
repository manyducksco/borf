import { HTTP } from "../data/HTTP";
import { Router } from "../routing/Router";

export class App {
  #initFn;
  #router;
  #services = {};
  #cache = {};
  #http = new HTTP();

  constructor(options = {}) {
    const injectables = this.#getInjectables.bind(this);

    if (options.hash) {
      this.#router = new Router({ hash: true }, injectables);
    } else {
      this.#router = new Router({}, injectables);
    }
  }

  /**
   * Takes a function to configure the app before it starts. If the function returns
   * a Promise, the app will not be started until the Promise resolves.
   *
   * @param fn - App config function.
   */
  setup(fn) {
    this.#initFn = async () => fn();
  }

  /**
   * Adds a route to the router's list for matching.
   *
   * @param path - Path to match before calling handlers.
   * @param handlers - One or more route handler functions or zero or more handlers followed by one Component.
   */
  route(path, ...handlers) {
    this.#router.on(path, ...handlers);
  }

  /**
   * Registers a service on the app. Services can be referenced on the `app` object
   * in both route handlers and Components using `app.services(name)`.
   *
   * @param name - Unique string to name this service.
   * @param service - Service class. One instance will be created and shared.
   */
  service(name, service) {
    this.#services[name] = new service();
  }

  /**
   * Initializes the app and starts routing.
   *
   * @param element - Selector string or DOM node to attach to.
   */
  start(element) {
    const injectables = this.#getInjectables();

    for (const name in this.#services) {
      const service = this.#services[name];

      service.app = injectables.app;
      service.http = injectables.http;

      if (typeof service.init === "function") {
        service.init();
      }
    }

    if (this.#initFn) {
      this.#initFn().then(() => {
        this.#router.connect(element);
      });
    } else {
      this.#router.connect(element);
    }
  }

  #getInjectables() {
    const self = this;

    return {
      app: Object.freeze({
        get title() {
          return document.title;
        },
        set title(value) {
          document.title = value;
        },
        get path() {
          return self.#router.matched?.path;
        },
        get route() {
          return self.#router.matched?.route;
        },
        get params() {
          return self.#router.matched?.params;
        },
        get query() {
          return self.#router.matched?.query;
        },
        get wildcard() {
          return self.#router.matched?.wildcard;
        },
        get cache() {
          return self.#cache;
        },
        services: (name) => {
          if (self.#services[name]) {
            return self.#services[name];
          }

          throw new Error(
            `A service was requested but not found. Received: ${name}`
          );
        },
        navigate: this.#router.navigate.bind(this.#router),
      }),
      http: this.#http,
    };
  }
}

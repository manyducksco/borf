import { isFunction, isString } from "../_helpers/typeChecking";
import { makeDolla } from "./dolla/Dolla";

import Debug from "./services/@debug";
import HTTP from "./services/@http";
import Page from "./services/@page";
import Router from "./services/@router";

export class App {
  #setup;
  #services = {};
  #routes = [];
  #outlet;
  #mounted;

  constructor(options = {}) {
    this.service("@debug", Debug, options.debug);
    this.service("@http", HTTP);
    this.service("@page", Page);
    this.service("@router", Router, {
      root: this.#outlet,
      routes: this.#routes,
      history: options.history,
      hash: options.hash,
    });
  }

  /**
   * Takes a function that configures the app before it starts.
   * This function is called after services have been created
   *
   * If the function returns
   * a Promise, the app will not be started until the Promise resolves.
   *
   * @param fn - App config function.
   */
  setup(fn) {
    this.#setup = async () => fn((name) => this.#getService(name));

    return this;
  }

  /**
   * Adds a route to the list for matching when the URL changes.
   *
   * @param path - Path to match before calling handlers.
   * @param component - Component to display when route matches.
   */
  route(path, component) {
    this.#routes.push({
      path,
      callback: () => {
        const router = this.#getService("@router");

        const $ = makeDolla({
          getService: (name) => this.#getService(name),
          route: {
            params: router.params(),
            query: router.query(),
            path: router.path(),
            route: router.route(),
            wildcard: router.wildcard(),
          },
        });

        if (this.#mounted) {
          this.#mounted.$disconnect();
        }
        this.#mounted = $(component)();
        this.#mounted.$connect(this.#outlet);
      },
    });

    return this;
  }

  /**
   * Registers a service on the app. Services can be referenced on
   * Services and Components using `this.service(name)`.
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

    return this;
  }

  /**
   * Initializes the app and starts routing.
   *
   * @param element - Selector string or DOM node to attach to.
   */
  connect(element) {
    if (isString(element)) {
      element = document.querySelector(element);
    }

    if (element instanceof Node == false) {
      throw new TypeError(`Expected a DOM node. Received: ${element}`);
    }

    this.#outlet = element;

    for (const name in this.#services) {
      const service = this.#services[name];
      const instance = new service.template((name) => this.#getService(name));

      service.instance = instance;

      if (isFunction(instance._created)) {
        if (name === "@router") {
          instance._created({
            ...service.options,
            root: this.#outlet,
          });
        } else {
          instance._created(service.options);
        }
      }
    }

    const done = () => {
      this.#getService("@router")._started();
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

    throw new Error(`Service is not registered in this app. Received: ${name}`);
  }
}

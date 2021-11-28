import { createBrowserHistory, createHashHistory } from "history";
import { HTTP } from "../data/HTTP";
import { state } from "../data/state";
import { createRouter } from "../routing/utils";
import catchLinks from "../_helpers/catchLinks";
import { isNumber, isString } from "../_helpers/typeChecking";
import { makeDolla } from "../templating/Dolla";

export class App {
  #setup;
  #services = {};
  #router = createRouter();
  #history;
  #outlet;
  #mounted;
  #http = new HTTP();
  #app = Object.freeze({
    title: state(document.title),
    path: state(""),
    route: state(""),
    params: state({}),
    query: state({}),
    wildcard: state(false),
    services: (name) => {
      if (this.#services[name]) {
        return this.#services[name];
      }

      throw new Error(
        `A service was requested but not found. Received: ${name}`
      );
    },
    /**
     * Navigates to another route or traverses navigation history with a number of steps.
     *
     * @example
     * app.navigate(-1);
     * app.navigate(2);
     * app.navigate("/other/path");
     * app.navigate("/other/path", { replace: true });
     *
     * @param to - Path string or number of history entries
     * @param options - `replace: true` to replace state
     */
    navigate: (to, options = {}) => {
      if (isNumber(to)) {
        this.#history.go(to);
      } else if (isString(to)) {
        if (options.replace) {
          this.#history.replace(to);
        } else {
          this.#history.push(to);
        }
      } else {
        throw new TypeError(`Expected a number or string. Received: ${to}`);
      }
    },
  });

  constructor(options = {}) {
    if (options.history) {
      this.#history = options.history;
    } else if (options.hash) {
      this.#history = createHashHistory();
    } else {
      this.#history = createBrowserHistory();
    }
  }

  /**
   * Takes a function to configure the app before it starts. If the function returns
   * a Promise, the app will not be started until the Promise resolves.
   *
   * @param fn - App config function.
   */
  setup(fn) {
    this.#setup = async () => fn();
  }

  /**
   * Adds a route to the list for matching when the URL changes.
   *
   * @param path - Path to match before calling handlers.
   * @param component - Component to display when route matches.
   */
  route(path, component) {
    this.#router.on(path, { component });
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
    if (isString(element)) {
      element = document.querySelector(element);
    }

    if (element instanceof Node == false) {
      throw new TypeError(`Expected a DOM node. Received: ${element}`);
    }

    this.#outlet = element;

    for (const name in this.#services) {
      const service = this.#services[name];

      service.app = this.#app;
      service.http = this.#http;

      if (typeof service.created === "function") {
        service.created();
      }
    }

    const done = () => {
      // Subscribe to value changes on app's title to update document.
      this.#app.title((value) => {
        document.title = value;
      });

      this.#history.listen(this.onRouteChanged.bind(this));

      catchLinks(this.#outlet, (anchor) => {
        const href = anchor.getAttribute("href");
        this.#history.push(href);

        // TODO: Handle relative links
      });

      // Do initial match
      this.onRouteChanged(this.#history);
    };

    if (this.#setup) {
      this.#setup().then(done);
    } else {
      done();
    }
  }

  onRouteChanged({ location }) {
    const matched = this.#router.match(location.pathname + location.search);

    console.log(location, matched);

    if (matched) {
      this.#app.path(matched.path);
      this.#app.params(matched.params);
      this.#app.query(matched.query);
      this.#app.wildcard(matched.wildcard);

      if (matched.route !== this.#app.route()) {
        this.#app.route(matched.route);

        const { component } = matched.attributes;
        const $ = makeDolla({
          app: this.#app,
          http: this.#http,
          route: matched,
        });

        if (this.#mounted) {
          this.#mounted.disconnect();
        }
        this.#mounted = $(component)();
        this.#mounted.connect(this.#outlet);
      }
    } else {
      console.warn(
        `No route was matched. Consider adding a wildcard ("*") route to catch this.`
      );
    }
  }
}

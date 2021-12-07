import { createBrowserHistory, createHashHistory } from "history";
import { state } from "../state/state";
import { createRouter } from "../_helpers/routing";
import { Service } from "../Service";
import catchLinks from "../_helpers/catchLinks";

export default class Router extends Service {
  #router = createRouter();
  #history;
  #debug;

  route = state();
  path = state();
  params = state({});
  query = state({});
  wildcard = state(false);

  _created(options) {
    this.#debug = this.service("@debug").channel("woof:router");

    this.#debug.log("created", options);

    if (options.history) {
      this.#history = options.history;
    } else if (options.hash) {
      this.#history = createHashHistory();
    } else {
      this.#history = createBrowserHistory();
    }

    for (const route of options.routes) {
      this.#router.on(route.path, { callback: route.callback });
    }

    this.#history.listen(this.#onRouteChanged.bind(this));

    catchLinks(options.root, (anchor) => {
      const href = anchor.getAttribute("href");
      this.#history.push(href);

      // TODO: Handle relative links
    });
  }

  _started() {
    this.#debug.log("started");

    // Do initial match
    this.#onRouteChanged(this.#history);
  }

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
  navigate(to, options = {}) {
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
  }

  #onRouteChanged({ location }) {
    const matched = this.#router.match(location.pathname + location.search);

    if (matched) {
      this.path(matched.path);
      this.params(matched.params);
      this.query(matched.query);
      this.wildcard(matched.wildcard);

      if (matched.route !== this.route()) {
        this.route(matched.route);

        const { callback } = matched.attributes;

        return callback(matched);
      }
    } else {
      console.warn(
        `No route was matched. Consider adding a wildcard ("*") route to catch this.`
      );
    }
  }
}

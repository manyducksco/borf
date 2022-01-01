import { createBrowserHistory, createHashHistory } from "history";
import { makeState } from "../state/makeState";
import { createRouter, joinPath } from "../../_helpers/routing";
import { Service } from "../Service";
import { isNumber, isString } from "../../_helpers/typeChecking";
import catchLinks from "../../_helpers/catchLinks";

export default class Router extends Service {
  #router = createRouter();
  #history;
  #debug;

  route = makeState();
  path = makeState();
  params = makeState({});
  query = makeState({});
  wildcard = makeState(false);

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
      let href = anchor.getAttribute("href");

      if (!/^https?:\/\/|^\//.test(href)) {
        href = joinPath(window.location.pathname, href);
      }

      this.#debug.log("caught link click: " + href);

      this.#history.push(href);
    });
  }

  _connected() {
    this.#onRouteChanged(this.#history); // Do initial match when app starts.
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

  /**
   * Registers a route and returns a cancel function. Used internally by $.outlet().
   */
  $on(path, callback) {
    return this.#router.on(path, { callback });
  }

  #onRouteChanged({ location }) {
    const matched = this.#router.match(location.pathname + location.search);

    if (matched) {
      this.path.set(matched.path);
      this.params.set(matched.params);
      this.query.set(matched.query);
      this.wildcard.set(matched.wildcard);

      if (matched.route !== this.route.get()) {
        this.route.set(matched.route);

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

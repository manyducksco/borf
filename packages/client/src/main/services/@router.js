import { createBrowserHistory, createHashHistory } from "history";
import { makeState } from "../state/makeState";
import { createRouter } from "../../_helpers/routing";
import { Service } from "../Service";
import { isFunction, isDolla, isNode } from "../../_helpers/typeChecking";
import catchLinks from "../../_helpers/catchLinks";

/**
 * NOTES:
 *
 * Outlets need to mount themselves on the router as they're connected.
 * Route matching should go through all levels of outlets and adjust matches
 * as needed when route changes.
 */

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
      const href = anchor.getAttribute("href");
      this.#history.push(href);

      // TODO: Handle relative links
    });
  }

  _connected() {
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

      // TODO: Implement proper routing. Outlets only work because everything is remounted every time the route changes. Need a way of rerouting reactively.
      // if (matched.route !== this.route.get()) {
      this.route.set(matched.route);

      const { callback } = matched.attributes;

      return callback(matched);
      // }
    } else {
      console.warn(
        `No route was matched. Consider adding a wildcard ("*") route to catch this.`
      );
    }
  }

  // #mountRoute(component) {
  //   const $ = makeDolla({
  //     getService: (name) => this.service(name),
  //     route: {
  //       params: this.params.get(),
  //       query: this.query.get(),
  //       path: this.path.get(),
  //       route: this.route.get(),
  //       wildcard: this.wildcard.get(),
  //     },
  //   });

  //   const node = $(component)();

  //   const mount = (newNode) => {
  //     this.#debug.log("mounting node", newNode);

  //     if (this.#mounted) {
  //       this.#mounted.$disconnect();
  //     }
  //     this.#mounted = newNode;
  //     this.#mounted.$connect(this.#outlet);
  //   };

  //   if (isFunction(node.preload)) {
  //     // Mount preload's returned element while preloading
  //     let tempNode = node.preload($, () => mount(node));

  //     if (tempNode) {
  //       if (isDolla(tempNode)) {
  //         tempNode = tempNode();
  //       }

  //       if (isNode(tempNode)) {
  //         mount(tempNode);
  //       } else {
  //         throw new Error(
  //           `Expected component's preload function to return an $element or undefined. Received: ${tempNode}`
  //         );
  //       }
  //     }
  //   } else {
  //     mount(node);
  //   }
  // }
}

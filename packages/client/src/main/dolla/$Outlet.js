import { makeState } from "@woofjs/state";
import { makeRouter } from "@woofjs/router";
import { $Node } from "./$Node.js";
import { isFunction, isNode, isComponent, isDolla } from "../../_helpers/typeChecking.js";
import { makeDolla } from "./makeDolla.js";
import { makeRender } from "./makeRender.js";
import { makeComponent } from "../makeComponent.js";

/**
 * Creates a router outlet for a nested route. Multiple routes
 * are attached and the best match is displayed at this element's position.
 */
export class $Outlet extends $Node {
  static get isComponent() {
    return true;
  }

  #outlet;
  #mounted;
  #dolla;
  #router = makeRouter();
  #path;
  #debug;
  #depth;

  $route = makeState({
    route: "",
    path: "",
    params: {},
    query: {},
    wildcard: null,
    depth: 1,
  });

  get isConnected() {
    return this.#outlet && this.#outlet.isConnected;
  }

  constructor(getService, element, $route) {
    super();

    this.createElement = makeRender(element);

    this.#path = $route.map("wildcard");
    this.#depth = $route.map("depth", (current) => (current || 0) + 1);
    this.$route.set((current) => {
      current.$parent = $route;
    });
    this.#dolla = makeDolla({
      getService,
      $route: this.$route,
    });
    this.#debug = getService("@debug").channel("woof:outlet");
  }

  route(route, component) {
    if (isFunction(component)) {
      component = makeComponent(component);
    }

    if (!isComponent(component)) {
      throw new TypeError(`Route needs a path and a component. Got: ${path} and ${component}`);
    }

    this.#router.on(route, { component });

    return this;
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#outlet = this.createElement();
    }

    this.#outlet.connect(parent, after);

    if (!wasConnected) {
      this.watchState(this.#path, (value) => value && this.#matchRoute(value), { immediate: true });
      this.watchState(
        this.$route,
        "route",
        (value) => {
          if (this.#outlet.element) {
            this.#outlet.element.dataset.outletRoute = value;
          }
        },
        { immediate: true }
      );

      this.connected();
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.#outlet.disconnect();
    }
  }

  #matchRoute(path) {
    const matched = this.#router.match(path);

    if (matched) {
      const currentRoute = this.$route.get("route");

      this.$route.set((current) => {
        current.path = matched.path;
        current.route = matched.route;
        current.query = matched.query;
        current.params = matched.params;
        current.wildcard = matched.wildcard;
      });

      if (this.#mounted == null || matched.route !== currentRoute) {
        this.#mountRoute(matched.props.component);
      }
    } else {
      this.$route.set((current) => {
        current.path = null;
        current.route = null;
        current.query = Object.create(null);
        current.params = Object.create(null);
        current.wildcard = null;
      });

      console.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  #mountRoute(component) {
    if (!this.isConnected) {
      return;
    }

    const $ = this.#dolla;
    const node = $(component)();

    const mount = (newNode) => {
      // if (this.#mounted !== newNode) {
      if (this.#mounted) {
        this.#mounted.disconnect();
      }
      this.#mounted = newNode;
      this.#mounted.connect(this.#outlet.element);
      // }
    };

    let start = Date.now();
    node.preload(mount).then(() => {
      const time = Date.now() - start;
      mount(node);
      // console.log(this.$route.get());
      this.#debug.log(`[➔${this.#depth.get()}] mounted route '${this.$route.get("route")}' - preloaded in ${time}ms`);
    });
  }
}

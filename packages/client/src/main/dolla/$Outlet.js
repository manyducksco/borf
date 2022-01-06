import { makeState } from "@woofjs/state";
import { makeRouter } from "@woofjs/router";
import { $Node } from "./$Node.js";
import { isFunction, isNode, isComponent } from "../../_helpers/typeChecking.js";
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

  $route = makeState({
    route: "",
    path: "",
    params: {},
    query: {},
    wildcard: null,
  });

  get $isConnected() {
    return this.#outlet && this.#outlet.$isConnected;
  }

  constructor(getService, element, $route) {
    super();

    this.createElement = makeRender(element);

    this.#path = $route.map("path");
    this.#dolla = makeDolla({
      getService,
      $route: this.$route,
    });
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

  $connect(parent, after = null) {
    const wasConnected = this.$isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#outlet = this.createElement();
    }

    this.#outlet.$connect(parent, after);

    if (!wasConnected) {
      this.watchState(this.#path, (value) => this.#matchRoute(value));
      this.watchState(this.$route, "route", (value) => {
        this.#outlet.$element.dataset.outletRoute = value;
      });
      this.#matchRoute(this.#path.get());
      this.#outlet.$element.dataset.outletRoute = this.$route.get("route");

      this._connected();
    }
  }

  $disconnect() {
    if (this.$isConnected) {
      this.#outlet.$disconnect();
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
      this.$route.set({
        path: null,
        route: null,
        query: {},
        params: {},
        wildcard: null,
      });

      console.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  #mountRoute(component) {
    if (!this.$isConnected) {
      return;
    }

    const $ = this.#dolla;

    const node = $(component)();

    const mount = (newNode) => {
      if (this.#mounted !== newNode) {
        if (this.#mounted) {
          this.#mounted.$disconnect();
        }
        this.#mounted = newNode;
        this.#mounted.$connect(this.#outlet.$element);
      }
    };

    if (isFunction(node.preload)) {
      // Mount preload's returned element while preloading
      let tempNode = node.preload($, () => mount(node));

      if (tempNode) {
        if (isDolla(tempNode)) {
          tempNode = tempNode();
        }

        if (isNode(tempNode)) {
          mount(tempNode);
        } else {
          throw new Error(
            `Expected component's preload function to return an $element or undefined. Received: ${tempNode}`
          );
        }
      }
    } else {
      mount(node);
    }
  }
}

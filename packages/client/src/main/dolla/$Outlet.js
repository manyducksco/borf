import { $Node } from "./$Node";
import { createRouter } from "../../_helpers/routing";
import { isFunction, isNode } from "../../_helpers/typeChecking";
import { makeDolla } from "./Dolla";
import { makeRender } from "./makeRender";
import { makeState } from "../state/makeState";

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
  #router = createRouter();
  #path;
  #match = {
    route: makeState(undefined),
    path: makeState(undefined),
    params: makeState({}),
    query: makeState({}),
    wildcard: makeState(false),
  };

  get $isConnected() {
    return this.#outlet && this.#outlet.$isConnected;
  }

  constructor(getService, element, match) {
    super();

    this.createElement = makeRender(element);

    this.#path = match.path.map((value) => value);
    this.#dolla = makeDolla({
      getService,
      match: this.#match,
    });
  }

  route(route, component) {
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
      this.watchState(this.#match.route, (value) => {
        this.#outlet.$element.dataset.outletRoute = value;
      });
      this.#matchRoute(this.#path.get());
      this.#outlet.$element.dataset.outletRoute = this.#match.route.get();

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
    const currentRoute = this.#match.route.get();

    this.#match.path.set(matched ? matched.path : null);
    this.#match.route.set(matched ? matched.route : null);
    this.#match.query.set(matched ? matched.query : {});
    this.#match.params.set(matched ? matched.params : {});
    this.#match.wildcard.set(matched ? matched.wildcard : false);

    if (matched) {
      if (this.#mounted == null || matched.route !== currentRoute) {
        const { component } = matched.attributes;

        this.#mountRoute(component);
      }
    } else {
      console.warn(
        `No route was matched. Consider adding a wildcard ("*") route to catch this.`
      );
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

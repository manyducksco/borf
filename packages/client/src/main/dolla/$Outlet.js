import { $Node } from "./$Node";
import { createRouter } from "../../_helpers/routing";
import { isFunction, isNode } from "../../_helpers/typeChecking";
import { makeDolla } from "./Dolla";
import { makeRender } from "./makeRender";

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
  #cancellers = [];
  #getService;
  #path;
  #router = createRouter();

  get $isConnected() {
    return this.#outlet && this.#outlet.$isConnected;
  }

  constructor(getService, element, path) {
    super();

    this.#getService = getService;
    this.#path = path;
    this.createElement = makeRender(element);
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

    const matched = this.#router.match(this.#path);

    if (matched) {
      if (this.#mounted == null || matched.path !== this.#mounted.path) {
        const { component } = matched.attributes;

        this.#mountRoute(matched, component);
      }
    } else {
      console.warn(
        `No route was matched. Consider adding a wildcard ("*") route to catch this.`
      );
    }

    if (!wasConnected) {
      this._connected();
    }
  }

  $disconnect() {
    if (this.$isConnected) {
      this.#outlet.$disconnect();

      for (const cancel of this.#cancellers) {
        cancel();
      }
    }
  }

  #mountRoute(route, component) {
    const $ = makeDolla({
      getService: (name) => this.#getService(name),
      route,
    });
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

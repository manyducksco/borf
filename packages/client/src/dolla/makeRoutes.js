import { makeRouter } from "@woofjs/router";
import { makeState } from "@woofjs/state";
import { makeNode } from "./makeNode.js";
import { makeDolla } from "./makeDolla.js";
import { isFunction, isNode, isComponent, isDolla, isString } from "../helpers/typeChecking.js";
import { joinPath } from "../helpers/joinPath.js";
import { makeComponent } from "../makeComponent.js";

/**
 * Work in progress
 *
 * Picks the closest matching nested route off of the parent's wildcard value
 * and displays that component.
 *
 * Takes an object with paths as keys and either a component or a redirect path as values.
 */
export const makeRoutes = makeNode((self, getService, $route, config) => {
  const $ownRoute = makeState({
    route: "",
    path: "",
    params: {},
    query: {},
    wildcard: null,
    depth: 1, // levels of nesting - +1 for each $.routes()
  });

  const $depth = $route.map("depth", (current) => (current || 0) + 1);
  const $path = $route.map("wildcard");

  const router = makeRouter();
  const debug = getService("@debug").makeChannel("woof:outlet");
  const dolla = makeDolla({ getService, $route: $ownRoute });

  let mounted;
  let watchers = [];

  for (const path in config) {
    const value = config[path];

    if (isString(value)) {
      router.on(path, { redirect: value === "" ? "/" : value });
    } else if (isFunction(value)) {
      router.on(path, { component: makeComponent(value) });
    } else if (isComponent(value)) {
      router.on(path, { component: value });
    } else {
      throw new TypeError(`Expected string or component for route '${path}'. Got: ${path}`);
    }
  }

  self.connected(() => {
    watchers.push(
      $path.watch(
        (current) => {
          if (current != null) {
            matchRoute(current);
          }
        },
        { immediate: true }
      )
    );

    watchers.push(
      $ownRoute.watch(
        (current) => {
          if (mounted) {
            if (mounted.element.element?.dataset) {
              mounted.element.element.dataset.route = current.route;
              mounted.element.element.dataset.path = current.path;
            } else if (mounted.element?.dataset) {
              mounted.element.dataset.route = current.route;
              mounted.element.dataset.path = current.path;
            }
          }
        },
        { immediate: true }
      )
    );
  });

  self.disconnected(() => {
    for (const unwatch of watchers) {
      unwatch();
    }
    watchers = [];

    if (mounted) {
      mounted.disconnect();
      mounted = null;
    }
  });

  async function matchRoute(path) {
    const matched = router.match(path);

    if (matched) {
      const routeChanged = matched.route !== $ownRoute.get("route");

      $ownRoute.set((current) => {
        current.path = matched.path;
        current.route = matched.route;
        current.query = matched.query;
        current.params = matched.params;
        current.wildcard = matched.wildcard;
      });

      if (matched.props.redirect) {
        let redirect = matched.props.redirect;

        if (redirect[0] !== "/") {
          redirect = joinPath($route.get("path"), redirect);

          if (redirect[0] !== "/") {
            redirect = "/" + redirect;
          }
        }

        getService("@router").go(redirect, { replace: true });
      } else if (mounted == null || routeChanged) {
        const { component, attrs } = matched.props;
        const node = dolla(component, attrs)();

        const mount = (newNode) => {
          if (mounted !== newNode) {
            if (mounted) {
              mounted.disconnect();
            }

            mounted = newNode;
            mounted.connect(self.element.parentNode, self.element);
          }
        };

        let start = Date.now();

        return node.preload(mount).then(() => {
          const time = Date.now() - start;
          mount(node);
          debug.log(`[depth ${$depth.get()}] mounted route '${$ownRoute.get("route")}' - preloaded in ${time}ms`);
        });
      }
    } else {
      if (mounted) {
        mounted.disconnect();
        mounted = null;
      }

      $ownRoute.set((current) => {
        current.path = null;
        current.route = null;
        current.query = Object.create(null);
        current.params = Object.create(null);
        current.wildcard = null;
      });

      console.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  return document.createTextNode("");
});

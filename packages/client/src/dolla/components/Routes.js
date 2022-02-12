import { makeRouter } from "@woofjs/router";
import { makeState } from "@woofjs/state";
import { isFunction, isComponent, isString, isComponentConstructor } from "../../helpers/typeChecking.js";
import { joinPath } from "../../helpers/joinPath.js";
import { makeComponent } from "../../makeComponent.js";
import { makeDolla } from "../makeDolla.js";

/**
 * Work in progress
 *
 * Picks the closest matching nested route off of the parent's wildcard value
 * and displays that component.
 *
 * Takes an object with paths as keys and either a component or a redirect path as values.
 */
export const Routes = makeComponent(($, self) => {
  self.debug.name = "woof:$.routes";

  const { $attrs, $route, getService } = self;
  const routes = $attrs.get("routes");
  const $depth = $route.map("depth", (current) => (current || 0) + 1);
  const $path = $route.map("wildcard");
  const $ownRoute = makeState({
    route: "",
    path: "",
    params: {},
    query: {},
    wildcard: null,
    depth: 1, // levels of nesting - +1 for each $.routes()
  });

  const router = makeRouter();
  const node = document.createTextNode("");
  const dolla = makeDolla({
    getService,
    $route: $ownRoute,
  });

  let mounted;

  for (const path in routes) {
    const value = routes[path];

    if (isString(value)) {
      router.on(path, { redirect: value === "" ? "/" : value });
    } else if (isComponentConstructor(value)) {
      router.on(path, { component: dolla(value) });
    } else if (isFunction(value)) {
      router.on(path, { component: makeComponent(value) });
    } else if (isComponent(value)) {
      router.on(path, { component: value });
    } else {
      throw new TypeError(`Expected string or component for route '${path}'. Got: ${path}`);
    }
  }

  self.connected(() => {
    self.watchState(
      $path,
      (current) => {
        if (current != null) {
          matchRoute(current);
        }
      },
      { immediate: true }
    );

    self.watchState(
      $ownRoute,
      (current) => {
        if (mounted) {
          mounted.element.dataset.route = current.route;
          mounted.element.dataset.path = current.path;
        }
      },
      { immediate: true }
    );
  });

  self.disconnected(() => {
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

        self.getService("@router").go(redirect, { replace: true });
      } else if (mounted == null || routeChanged) {
        let start = Date.now();

        if (mounted) {
          await mounted.disconnect();
        }

        mounted = $(matched.props.component);
        await mounted.connect(node.parentNode, node);

        self.debug.log(`[depth ${$depth.get()}] mounted route '${$ownRoute.get("route")}' in ${Date.now() - start}ms`);
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

  return node;
});

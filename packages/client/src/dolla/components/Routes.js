import { makeRouter } from "@woofjs/router";
import { makeState } from "@woofjs/state";
import { isFunction, isComponentFactory } from "../../helpers/typeChecking.js";
import { joinPath } from "../../helpers/joinPath.js";
import { makeComponent } from "../../makeComponent.js";
import { makeDolla } from "../makeDolla.js";
import { resolvePath } from "../../helpers/resolvePath.js";

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
  const $wildcard = $route.map("wildcard");
  const $ownRoute = makeState({
    route: "",
    path: "",
    href: "",
    params: {},
    query: {},
    wildcard: null,
  });

  const node = document.createTextNode("");
  const router = makeRouter();
  const dolla = makeDolla({
    getService,
    $route: $ownRoute,
  });

  let mounted;

  const defineRoutes = $attrs.get("defineRoutes");

  function when(path, component, attrs = {}) {
    if (isFunction(component) && !isComponentFactory(component)) {
      component = makeComponent(component);
    }

    router.on(path, { component, attrs });
  }

  function redirect(path, to) {
    router.on(path, { redirect: to === "" ? "/" : to });
  }

  defineRoutes(when, redirect);

  self.connected(() => {
    self.watchState(
      $wildcard,
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
    if (!node.parentNode) {
      return;
    }

    const matched = router.match(path);

    if (matched) {
      const routeChanged = matched.route !== $ownRoute.get("route") || mounted == null;

      $ownRoute.set((current) => {
        current.path = matched.path;
        current.route = matched.route;
        current.href = joinPath($route.get("href"), matched.path.slice(0, matched.path.lastIndexOf(matched.wildcard)));
        current.query = matched.query;
        current.params = matched.params;
        current.wildcard = matched.wildcard;
      });

      if (matched.props.redirect) {
        let resolved = resolvePath($route.get("href"), matched.props.redirect);

        if (resolved[0] !== "/") {
          resolved = "/" + resolved;
        }

        // FIXME: Causes redirect loops when the target route doesn't exist
        self.getService("@router").go(resolved, { replace: true });
      } else if (routeChanged) {
        const start = Date.now();

        if (mounted) {
          await mounted.disconnect();
        }

        mounted = dolla(matched.props.component, matched.props.attrs);
        await mounted.connect(node.parentNode, node);

        self.debug.log(`mounted route '${$ownRoute.get("route")}' in ${Date.now() - start}ms`);
      }
    } else {
      if (mounted) {
        mounted.disconnect();
        mounted = null;
      }

      $ownRoute.set((current) => {
        current.path = null;
        current.route = null;
        current.href = $route.get("href");
        current.query = {};
        current.params = {};
        current.wildcard = null;
      });

      self.debug.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  return node;
});

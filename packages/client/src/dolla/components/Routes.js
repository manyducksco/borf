import { makeRouter } from "@woofjs/router";
import { makeState } from "@woofjs/state";
import { isFunction, isComponentFactory } from "../../helpers/typeChecking.js";
import { joinPath } from "../../helpers/joinPath.js";
import { makeComponent } from "../../makeComponent.js";
import { makeDolla } from "../makeDolla.js";
import { resolvePath } from "../../helpers/resolvePath.js";

/**
 * Renders one component out of a set depending on the current URL.
 * Routes are relative to the route under which this component is mounted.
 */
export const Routes = makeComponent(($, self) => {
  self.debug.name = "woof:$:routes";

  const node = document.createTextNode("");

  const { $route } = self;

  // This component's routes are matched on the parent route's current `wildcard` value.
  const $wildcard = $route.map("wildcard");

  // Routes tracks the route object for its own segment.
  const $ownRoute = makeState({
    route: "",
    path: "",
    href: "",
    params: {},
    query: {},
    wildcard: null,
  });

  // Route matching logic is imported from @woofjs/router
  const router = makeRouter();

  // Dolla instance for child components. All routes nested under this will match on `$ownRoute.wildcard`
  const dolla = makeDolla({
    getService: self.getService,
    $route: $ownRoute,
  });

  // Stores the currently mounted component
  let mounted;

  /*=========================*\
  ||     Register Routes     ||
  /*=========================*/

  // This should be a function of the same format `app.routes` uses
  const defineRoutes = self.$attrs.get("defineRoutes");

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

  /*=========================*\
  ||     Lifecycle Hooks     ||
  /*=========================*/

  self.connected(() => {
    // This is where the magic happens
    self.watchState(
      $wildcard,
      (current) => {
        if (current != null) {
          matchRoute(current);
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

  /*=========================*\
  ||   Route Match & Mount   ||
  /*=========================*/

  async function matchRoute(path) {
    if (!node.parentNode) return;

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
        const created = dolla(matched.props.component, matched.props.attrs);

        const mount = (component) => {
          if (mounted) {
            mounted.disconnect();
          }

          mounted = component;
          mounted.connect(node.parentNode, node);
        };

        if (created.hasRoutePreload) {
          await created.routePreload(mount);
        }

        mount(created);

        self.debug.log(
          `Mounted nested route '${$ownRoute.get("href")}'${
            created.hasRoutePreload ? ` (loaded in ${Date.now() - start}ms)` : ""
          }`
        );
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

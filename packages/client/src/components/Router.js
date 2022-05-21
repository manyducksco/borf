import { makeRouter } from "@woofjs/router";
import { makeState } from "@woofjs/state";
import { isFunction, isComponent } from "../helpers/typeChecking.js";
import { joinPath } from "../helpers/joinPath.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { makeComponent } from "../makeComponent.js";
import { makeDolla } from "../makeDolla.js";

/**
 * Displays the component that matches the current URL.
 * Routes are relative to the route this component is mounted under.
 */
export const Router = makeComponent((_, self) => {
  self.debug.name = "woof:$:router";

  const node = document.createTextNode("");

  const $route = makeState({
    route: null, // The string representation of the route that was matched (including ':params' and '*')
    path: null, // The actual path that was matched against the route. What appears in the URL bar.
    params: {}, // Matched :params extracted from the matched path.
    query: {}, // Query params extracted from the matched path.
    wildcard: null, // The matched value for the wildcard portion of the route.
    fullPath: null, // Full path joined with parent
  });

  // Route matching logic is imported from @woofjs/router
  const router = makeRouter();

  // Dolla instance for child components. All routes nested under this will match on `$route.wildcard`
  const dolla = makeDolla({
    getService: self.getService,
    $route,
  });

  // Stores the currently mounted component
  let mounted;

  /*=========================*\
  ||     Register Routes     ||
  \*=========================*/

  // This should be a function of the same format `app.routes` takes
  const defineRoutes = self.get("defineRoutes");

  function route(path, component, attrs = {}) {
    if (isFunction(component) && !isComponent(component)) {
      component = makeComponent(component);
    }

    router.on(path, { component, attrs });
  }

  function redirect(path, to) {
    router.on(path, { redirect: to === "" ? "/" : to });
  }

  defineRoutes({
    route,
    redirect,
  });

  /*=========================*\
  ||     Lifecycle Hooks     ||
  \*=========================*/

  // This is where the magic happens.
  // Routes are matched on the 'wildcard' of the route this component is mounted under.
  self.watchState(
    self.map("@route.wildcard"),
    (current) => {
      if (current != null) {
        matchRoute(current);
      }
    },
    { immediate: true }
  );

  self.disconnected(() => {
    if (mounted) {
      mounted.disconnect();
      mounted = null;
    }
  });

  /*=========================*\
  ||   Route Match & Mount   ||
  \*=========================*/

  async function matchRoute(path) {
    if (!node.parentNode) return;

    const matched = router.match(path);

    if (matched) {
      const routeChanged = matched.route !== $route.get("route") || mounted == null;
      const wildcard = self.get("@route.wildcard");
      const path = self.get("@route.path");

      let fullPath;

      if (wildcard != null) {
        fullPath = joinPath(path.slice(0, path.lastIndexOf(wildcard)), matched.path);
      } else {
        fullPath = joinPath(path, matched.path);
      }

      $route.set((current) => {
        current.path = matched.path;
        current.route = matched.route;
        current.query = matched.query;
        current.params = matched.params;
        current.wildcard = matched.wildcard;
        current.fullPath = fullPath;
      });

      if (matched.props.redirect) {
        let resolved = resolvePath(self.get("@route.fullPath"), matched.props.redirect);

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
          `Mounted nested route '${$route.get("fullPath")}'${
            created.hasRoutePreload ? ` (loaded in ${Date.now() - start}ms)` : ""
          }`
        );
      }
    } else {
      if (mounted) {
        mounted.disconnect();
        mounted = null;
      }

      $route.set((current) => {
        current.path = null;
        current.route = null;
        current.query = {};
        current.params = {};
        current.wildcard = null;
        current.fullPath = self.get("@route.fullPath") || null;
      });

      self.debug.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  return node;
});

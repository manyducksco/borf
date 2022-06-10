import { makeState } from "@woofjs/state";
import { makeService } from "../makeService";
import { parseRoute, matchRoute, sortRoutes } from "../helpers/routing";
import { isObject } from "../helpers/typeChecking";
import { resolvePath } from "../helpers/resolvePath";
import { joinPath } from "../helpers/joinPath";
import { catchLinks } from "../helpers/catchLinks";

/**
 * Top level navigation service.
 */
export default makeService((self) => {
  self.debug.name = "woof:@router";

  const { getRoot, history, routes } = self.options;

  for (const route of routes) {
    self.debug.log(route);
  }

  const $route = makeState(); // The route path with placeholder parameters
  const $path = makeState(); // The literal path as it shows up in the URL bar
  const $params = makeState({}); // Values matched for named route params
  const $query = makeState({}); // Magic state that syncs with with the browser's query params

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  function onHistoryChange({ location }) {
    self.debug.log("location", location);

    $path.set(location.pathname);
  }

  self.afterConnect(() => {
    history.listen(onHistoryChange);
    onHistoryChange(history);

    catchLinks(getRoot(), (anchor) => {
      let href = anchor.getAttribute("href");

      if (!/^https?:\/\/|^\//.test(href)) {
        href = joinPath(history.location.pathname, href);
      }

      history.push(href);

      appDebug.log(`Intercepted link to '${href}'`);
    });
  });

  // Update $query when URL changes
  self.watchState($route, (current) => {
    isRouteChange = true;
    $query.set(current.query);
  });

  // Update URL when $query changes
  self.watchState($query, (current) => {
    if (isRouteChange) {
      isRouteChange = false;
      return;
    }

    const params = new URLSearchParams();

    for (const key in current) {
      params.set(key, current[key]);
    }

    history.replace({
      pathname: history.location.pathname,
      search: "?" + params.toString(),
    });
  });

  return {
    $route,
    $path,
    $params,
    $query,

    back(steps = 1) {
      history.go(-steps);
    },

    forward(steps = 1) {
      history.go(steps);
    },

    /**
     * Navigates to another route.
     *
     * @example
     * navigate("/users", 215, { replace: true }); // replace current history entry with `/users/215`
     *
     * @param args - One or more path segments optionally followed by an options object.
     */
    navigate(...args) {
      let path = "";
      let options = {};

      if (isObject(args[args.length - 1])) {
        options = args.pop();
      }

      path = joinPath(...args);
      path = resolvePath(history.location.pathname, path);

      if (options.replace) {
        history.replace(path);
      } else {
        history.push(path);
      }
    },
  };
});

// async function onRouteChanged({ location }) {
//   const matched = router.match(location.pathname + location.search);

//   if (matched) {
//     const { $route } = getService("@router");
//     const routeChanged = matched.route !== $route.get("route");

//     // Top level route details are stored on @router where they can be read by apps and services.
//     // Nested route info is found in `self.$route` in components.
//     $route.set((current) => {
//       current.route = matched.route;
//       current.path = matched.path;
//       current.params = matched.params;
//       current.query = matched.query;
//       current.wildcard = matched.wildcard;
//     });

//     if (matched.props.redirect) {
//       getService("@router").navigate(matched.props.redirect, { replace: true });
//     } else if (routeChanged) {
//       const start = Date.now();
//       const created = matched.props.component({
//         getService,
//         dolla,
//         attrs: matched.props.attributes || {},
//         children: [],
//         $route,
//       });

//       const mount = (component) => {
//         if (mounted) {
//           mounted.disconnect();
//         }

//         mounted = component;
//         mounted.connect(outlet);
//       };

//       if (created.hasRoutePreload) {
//         await created.routePreload(mount);
//       }

//       mount(created);

//       appDebug.log(
//         `Mounted top level route '${matched.route}'${
//           created.hasRoutePreload ? ` (loaded in ${Date.now() - start}ms)` : ""
//         }`
//       );
//     }
//   } else {
//     appDebug.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
//   }
// }

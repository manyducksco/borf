import queryString from "query-string";
import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { matchRoute, parseRoute } from "../helpers/routing.js";
import { isObject } from "../helpers/typeChecking.js";
import { joinPath } from "../helpers/joinPath.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { catchLinks } from "../helpers/catchLinks.js";

/**
 * Top level navigation service.
 */
export default makeService((self) => {
  self.debug.name = "woof:@router";

  const { getRoot, history, routes } = self.options;

  // Parse route paths into a matchable format.
  for (const route of routes) {
    route.fragments = parseRoute(route.path).fragments;
  }

  // Test redirects to make sure all possible redirect targets actually exist.
  for (const route of routes) {
    if (route.redirect) {
      const match = matchRoute(
        routes.filter((r) => r !== route),
        route.redirect
      );

      if (!match) {
        throw new Error(`Found a redirect to an undefined URL. From '${route.path}' to '${route.redirect}'`);
      }
    }
  }

  const $route = makeState(); // Route path with placeholder parameters
  const $path = makeState(); // Real path as it shows up in the URL bar
  const $params = makeState({}); // Matched values for named route params
  const $query = makeState({}); // Magic state that syncs with with the browser's query params

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  // Update URL when $query changes
  self.watchState($query, (current) => {
    // No-op if this is triggered by a route change.
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

  self.afterConnect(() => {
    history.listen(onRouteChange);
    onRouteChange(history);

    catchLinks(getRoot(), (anchor) => {
      let href = anchor.getAttribute("href");

      if (!/^https?:\/\/|^\//.test(href)) {
        href = joinPath(history.location.pathname, href);
      }

      history.push(href);

      self.debug.log(`Intercepted link to '${href}'`);
    });
  });

  function onRouteChange({ location }) {
    const matched = matchRoute(routes, location.pathname);

    if (matched) {
      if (matched.data.redirect != null) {
        history.replace(matched.data.redirect);
      } else {
        $params.set(matched.params);

        if (matched.route !== $route.get()) {
          $path.set(matched.path);
          $route.set(matched.route);

          self.debug.log({ layers: matched.data.layers });

          // TODO: Mount components
        }
      }
    } else {
      self.debug.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }

    isRouteChange = true;
    $query.set(
      queryString.parse(location.search, {
        parseBooleans: true,
        parseNumbers: true,
      })
    );

    console.log({
      path: $path.get(),
      route: $route.get(),
      params: $params.get(),
      query: $query.get(),
    });
  }

  return {
    $route: $route.map(),
    $path: $path.map(),
    $params: $params.map(),
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

      path = resolvePath(history.location.pathname, joinPath(...args));

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

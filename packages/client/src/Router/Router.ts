import {
  createBrowserHistory,
  History,
  Listener as HistoryListener,
} from "history";
import { match } from "path-to-regexp";
import queryString from "query-string";
import { Component } from "../Components";
import { isString } from "../utils";
import handleLinks from "./handleLinks";
import {
  RouteArray,
  RouteHandler,
  RouteObject,
  RouteRedirectOptions,
  RouterEntry,
  RouterOptions,
} from "./Router.types";

export class Router {
  private outlet?: Node;
  private cancellers: Array<() => void> = [];
  private history: History;
  private routes: RouterEntry[] = [];
  private mountedComponent?: Component;

  constructor(options?: RouterOptions) {
    this.history = options?.history ?? createBrowserHistory();
  }

  /**
   * Registers a new route and its handler function(s).
   *
   * @param route - path string (like '/example/:id/edit')
   * @param handlers - One or more route handler functions
   */
  on(route: string, ...handlers: RouteHandler[]) {
    const path = this.normalizePath(route);
    this.routes.push({
      path,
      handlers,
      match: match(path, {
        decode: decodeURIComponent,
      }),
    });

    return this;
  }

  /**
   * Starts routing, rendering the current route component into the `outlet` element.
   *
   * @param outlet - Target DOM node for routes to be rendered into
   */
  connect(outlet: Node | string) {
    let node: Node | null;

    if (isString(outlet)) {
      node = document.querySelector(outlet);
    } else {
      node = outlet;
    }

    if (node == null) {
      throw new Error(`Outlet was not found.`);
    }

    this.outlet = node;

    const onRouteChanged: HistoryListener = ({ location }) => {
      this.matchRoute(location.pathname + location.search);
    };

    this.cancellers.push(this.history.listen(onRouteChanged));
    this.cancellers.push(
      handleLinks(node, (anchor) => {
        const href = anchor.getAttribute("href")!;
        this.history.push(href);
      })
    );

    // Do initial match
    onRouteChanged(this.history);
  }

  disconnect() {
    for (const cancel of this.cancellers) {
      cancel();
    }
  }

  private normalizePath(path: string) {
    if (path[0] !== "/") {
      path = "/" + path;
    }

    return path;
  }

  private matchRoute(href: string) {
    const [path, search] = href.split("?");
    const query = queryString.parse(search);

    console.time("matched route");

    for (const route of this.routes) {
      const matched = route.match(path);

      if (matched) {
        let handlerIndex = -1;

        const routeObject: RouteObject = {
          href: matched.path,
          path: route.path,
          params: matched.params as { [name: string]: string },
          query: query as { [name: string]: string },
          next: (data: any) => {
            if (route.handlers[handlerIndex + 1]) {
              handlerIndex++;
              const result = route.handlers[handlerIndex](routeObject, data);

              if (result instanceof Component) {
                // Mount the component
                requestAnimationFrame(() => {
                  if (this.mountedComponent) {
                    this.mountedComponent.disconnect();
                  }

                  this.mountedComponent = result;
                  this.mountedComponent.connect(this.outlet!);
                });
              } else {
                // Keep current component
                // console.log("not mounting any component");
              }
            } else {
              if (handlerIndex === 0) {
                throw new Error(`Route has no handler function.`);
              } else {
                throw new Error(
                  `Route called .next() but there is no handler after it.`
                );
              }
            }
          },
          redirect: (path: string, options?: RouteRedirectOptions) => {
            let query: any = {};
            const [pathOnly, routeQuery] = path.split("?");

            if (routeQuery) {
              Object.assign(query, queryString.parse(routeQuery));
            }

            if (options?.query) {
              Object.assign(query, options.query);
            }

            if (pathOnly[0] === "/") {
              // Root relative
            } else {
              // Current route relative
            }

            console.log("redirect", { path, options, pathOnly, routeQuery });
          },
          switch: (routes: RouteArray[]) => {
            return new Component(document.createElement("div"));
          },
        };

        routeObject.next();

        // console.log({ matched, route, path, query });
        break;
      }
    }

    console.timeEnd("matched route");
  }
}

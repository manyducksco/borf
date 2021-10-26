import { match, MatchFunction } from "path-to-regexp";
import qs from "qs";
import { Component } from "../Components";
import { isString } from "../utils";
import handleLinks from "./handleLinks";

type RouteArray = [route: string, ...handlers: RouteHandler[]];

type RouteObject = {
  /**
   * Full path as it appears in the URL bar.
   */
  href: string;

  /**
   * Router path as it was written to register the route.
   */
  path: string;

  /**
   * Keys and values for each :param matched in the route.
   */
  params: {
    [name: string]: string;
  };

  /**
   * Keys and values for each query parameter. All values are strings until parsed by you.
   */
  query: {
    [name: string]: string;
  };

  /**
   * Continues to the next handler if there is one. Throws an error if there isn't.
   * Call this function with a value and it will be passed as the second parameter to the next handler.
   */
  next: (data?: any) => void;

  /**
   * Go to another route.
   */
  redirect: (path: string) => void;

  /**
   * Define subroutes and render their contents wherever this component is placed when the route is matched.
   */
  switch: (routes: RouteArray[]) => Component;
};

type RouteHandler = (route: RouteObject, data?: any) => Component | void;

type RouterOptions = {
  /**
   * Pass your own history instance from the 'history' module.
   */
  history?: WithHistoryAPI;
};

interface WithHistoryAPI {
  pushState: (
    data: any,
    unused: string,
    url?: string | URL | null | undefined
  ) => void;
}

type RouterEntry = {
  path: string;
  match: MatchFunction;
  handlers: RouteHandler[];
};

export class Router {
  private outlet?: Node;
  private cancellers: Array<() => void> = [];
  private history: WithHistoryAPI;
  private routes: RouterEntry[] = [];
  private mountedComponent?: Component;

  constructor(options?: RouterOptions) {
    this.history = options?.history ?? window.history;
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

    const onRouteChanged = () => {
      this.matchRoute(window.location.pathname + window.location.search);
    };

    window.addEventListener("popstate", onRouteChanged);
    this.cancellers.push(() => {
      window.removeEventListener("popstate", onRouteChanged);
    });

    this.cancellers.push(
      handleLinks(node, (anchor) => {
        const href = anchor.getAttribute("href")!;
        this.history.pushState({}, "", href);
        this.matchRoute(href);
      })
    );

    // Do initial match
    onRouteChanged();
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
    const query = qs.parse(search).top;

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
                console.log("not mounting any component");
              }
            } else {
              throw new Error(`Route is missing a next route handler`);
            }
          },
          redirect: () => {},
          switch: (routes: RouteArray[]) => {
            return new Component(document.createElement("div"));
          },
        };

        routeObject.next();

        console.log({ matched, route, path, query });
        break;
      }
    }

    console.timeEnd("matched route");
  }
}

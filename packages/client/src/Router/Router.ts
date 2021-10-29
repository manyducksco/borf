import type { History } from "history";
import { createBrowserHistory, Listener as HistoryListener } from "history";
import type { MatchFunction, MatchResult } from "path-to-regexp";
import { match } from "path-to-regexp";
import queryString from "query-string";
import { Component } from "../Components";
import { isString } from "../utils";
import handleLinks from "./handleLinks";
import type {
  RouteArray,
  RouteHandler,
  RouteObject,
  RouteRedirectOptions,
  RouterEntry,
  RouterOptions,
} from "./Router.types";

export class Router {
  private outlet?: Element;
  private cancellers: Array<() => void> = [];
  private history: History;
  private routes: RouterEntry[] = [];
  private mountedComponent?: Component;
  private basePath: string;

  constructor(options?: RouterOptions) {
    this.history = options?.history ?? createBrowserHistory();
    this.basePath = options?.basePath ?? "";
  }

  /**
   * Registers a new route and its handler function(s).
   *
   * @param route - path string (like '/example/:id/edit')
   * @param handlers - One or more route handler functions
   */
  on(route: string, ...handlers: RouteHandler[]) {
    if (route.trim() === "*") {
      this.routes.push({
        path: "*",
        match: ((path: string) => {}) as MatchFunction,
        handlers,
      });
    } else {
      const path = this.joinPath(this.basePath, this.normalizePath(route));
      this.routes.push({
        path,
        handlers,
        match: match(path, {
          decode: decodeURIComponent,
        }),
      });
    }

    return this;
  }

  /**
   * Starts routing, rendering the current route component into the `outlet` element.
   *
   * @param outlet - Target DOM node for routes to be rendered into
   */
  connect(outlet: Element | string) {
    let node: Element | null;

    if (isString(outlet)) {
      node = document.querySelector(outlet);
    } else {
      node = outlet;
    }

    if (node == null) {
      throw new Error(`Outlet was not found.`);
    }

    this.outlet = node;
    this.outlet.setAttribute(
      "data-router-outlet",
      this.joinPath(this.basePath, "*")
    );

    const onRouteChanged: HistoryListener = ({ location }) => {
      this.matchRoute(location.pathname + location.search);
    };

    this.cancellers.push(this.history.listen(onRouteChanged));
    this.cancellers.push(
      handleLinks(this.history, node, (anchor) => {
        const href = anchor.getAttribute("href")!;
        this.history.push(href);
      })
    );

    // Do initial match
    onRouteChanged(this.history);
  }

  disconnect() {
    this.outlet?.removeAttribute("data-router-outlet");

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

  private joinPath(...parts: string[]) {
    parts = parts.filter((x) => x);

    let joined = parts.shift();

    if (joined) {
      for (const part of parts) {
        if (joined[joined.length - 1] !== "/") {
          if (part[0] !== "/") {
            joined += "/" + part;
          } else {
            joined += part;
          }
        }
      }
    }

    return joined ?? "";
  }

  private initRoute(
    target: queryString.ParsedUrl,
    route: RouterEntry,
    matched: MatchResult
  ) {
    let handlerIndex = -1;

    console.trace(matched.params, target.query);

    const routeObject: RouteObject = {
      href: matched.path,
      path: route.path,
      params: matched.params as { [name: string]: string },
      query: target.query as { [name: string]: string },
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
      redirect: (to: string, options?: RouteRedirectOptions) => {
        let { url, query } = queryString.parseUrl(to);

        if (options?.query) {
          Object.assign(query, options.query);
        }

        // Paths without slash are relative to current URL
        if (url[0] !== "/") {
          url = this.joinPath(target.url, url);
        }

        to = queryString.stringifyUrl({ url, query });

        if (options?.replace) {
          this.history.replace(to);
        } else {
          this.history.push(to);
        }
      },
      switch: (routes: RouteArray[]) => {
        return new RouteSwitchComponent({
          history: this.history,
          basePath: route.path,
          routes,
        });
      },
    };

    routeObject.next();
  }

  private matchRoute(href: string) {
    const target = queryString.parseUrl(href);

    if (this.basePath) {
      const basePath = this.joinPath(this.basePath, "(.*)?");

      if (!match(basePath)(target.url)) {
        return;
      }
    }

    let wildcard: RouterEntry | undefined;

    for (const route of this.routes) {
      if (!wildcard && route.path === "*") {
        wildcard = route;
        continue;
      }

      const matched = route.match(target.url);

      if (matched) {
        this.initRoute(target, route, matched);
        return;
      }
    }

    if (wildcard) {
      this.initRoute(target, wildcard, {
        path: target.url,
        index: 0,
        params: {},
      });
    }
  }
}

type RouteSwitchComponentOptions = {
  history: History;
  routes: RouteArray[];
  basePath: string;
};

class RouteSwitchComponent extends Component {
  router?: Router;

  constructor(private options: RouteSwitchComponentOptions) {
    super();
  }

  createElement() {
    return document.createElement("div");
  }

  beforeConnect() {
    if (!this.router) {
      const { element, options } = this;

      this.router = new Router({
        history: options.history,
        basePath: options.basePath,
      });

      for (const route of options.routes) {
        this.router.on(...route);
      }

      this.router.connect(element as Element);
    }
  }

  beforeDisconnect() {
    if (this.router) {
      this.router.disconnect();
      this.router = undefined;
    }
  }
}

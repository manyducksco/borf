import {
  type Route,
  patternToFragments,
  sortRoutes,
  isString,
  assertInstanceOf,
  joinPath,
  matchRoutes,
} from "@borf/bedrock";
import { EventSource } from "./EventSource.js";

type RouteHandler = () =>
  | EventSource
  | Record<string | number | symbol, any>
  | undefined
  | null
  | Promise<EventSource | Record<string | number | symbol, any> | undefined | null>;

export type RouteMeta = {
  verb: string;
  pattern: string;
  handlers: RouteHandler[]; // Includes middleware and final handler.
};

export class Router {
  routes: Route<RouteMeta>[] = [];

  #addRoute(verb: string, pattern: string, handlers: RouteHandler[]) {
    this.routes.push({
      pattern,
      fragments: patternToFragments(pattern),
      meta: {
        verb,
        pattern,
        handlers,
      },
    });
    this.routes = sortRoutes(this.routes);
  }

  /**
   * Adds a new middleware function that will run for every route on this Router.
   */
  addMiddleware() {
    // Add handlers to all methods.
  }

  /**
   * Responds to HTTP GET requests that match this URL pattern.
   */
  onGet(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("GET", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP POST requests that match this URL pattern.
   */
  onPost(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("POST", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP PUT requests that match this URL pattern.
   */
  onPut(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("PUT", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP PATCH requests that match this URL pattern.
   */
  onPatch(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("PATCH", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP DELETE requests that match this URL pattern.
   */
  onDelete(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("DELETE", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP HEAD requests that match this URL pattern.
   */
  onHead(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("HEAD", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP OPTIONS requests that match this URL pattern.
   */
  onOptions(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("OPTIONS", pattern, handlers);
    return this;
  }

  /**
   * Adds all routes from another Router to this one.
   *
   * @param router - Another Router instance.
   */
  addRoutes(router: Router): void;

  /**
   * Adds all routes from another Router to this one.
   *
   * @param prefix - Pattern to prepend to all routes, e.g. '/users', '/admin', etc.
   * @param router - Another Router instance.
   */
  addRoutes(prefix: string, router: Router): void;

  addRoutes(...args: unknown[]) {
    let prefix: string | undefined;

    if (isString(args[0])) {
      prefix = args.shift() as string;
    }

    assertInstanceOf(Router, args[0], "Expected a Router. Got type: %t, value: %v");
    const router = args[0] as Router;

    if (prefix) {
      // Prepend pattern to all routes.
      for (const route of router.routes) {
        const pattern = joinPath([prefix, route.pattern]);
        this.#addRoute(route.meta.verb, pattern, route.meta.handlers);
      }
    } else {
      for (const route of router.routes) {
        this.#addRoute(route.meta.verb, route.pattern, route.meta.handlers);
      }
    }
  }

  /**
   * Matches an HTTP verb and URL path against all registered routes. Returns the match if one is found.
   *
   * @param verb - HTTP verb the request was made with.
   * @param path - URL path.
   */
  matchRoute(verb: string, path: string) {
    verb = verb.toUpperCase();

    const matched = matchRoutes(this.routes, path, {
      willMatch: (route) => route.meta.verb === verb,
    });

    return matched;
  }
}

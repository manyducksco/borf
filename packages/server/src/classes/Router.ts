import {
  type Route,
  patternToFragments,
  sortRoutes,
  isString,
  assertInstanceOf,
  joinPath,
  matchRoutes,
} from "@borf/bedrock";
import { type HandlerContext } from "./App/makeRequestListener.js";

export type RouteHandler<ResBody = any, ReqBody = any> = (
  ctx: HandlerContext<ReqBody>,
  next: () => Promise<any>
) => ResBody | Promise<ResBody> | void;

export type RouteMeta = {
  verb: string;
  pattern: string;
  handlers: RouteHandler[]; // Includes middleware and final handler.
};

export class Router {
  routes: Route<RouteMeta>[] = [];
  #middleware: RouteHandler[] = [];

  #addRoute(verb: string, pattern: string, handlers: RouteHandler<any, any>[]) {
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
  middleware(handler: RouteHandler) {
    // Add handlers to all methods.
    this.#middleware.push(handler);
  }

  /**
   * Responds to HTTP GET requests that match this URL pattern.
   */
  get<ResBody = any>(pattern: string, ...handlers: RouteHandler<undefined, ResBody>[]) {
    this.#addRoute("GET", pattern, handlers);
    return this;
  }

  // TODO: Add ResBody and ReqBody type args to all route types once we have a TS backend to test this.

  /**
   * Responds to HTTP POST requests that match this URL pattern.
   */
  post<ResBody = any, ReqBody = any>(pattern: string, ...handlers: RouteHandler<ReqBody, ResBody>[]) {
    this.#addRoute("POST", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP PUT requests that match this URL pattern.
   */
  put(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("PUT", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP PATCH requests that match this URL pattern.
   */
  patch(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("PATCH", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP DELETE requests that match this URL pattern.
   */
  delete(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("DELETE", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP HEAD requests that match this URL pattern.
   */
  head(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("HEAD", pattern, handlers);
    return this;
  }

  /**
   * Responds to HTTP OPTIONS requests that match this URL pattern.
   */
  options(pattern: string, ...handlers: RouteHandler[]) {
    this.#addRoute("OPTIONS", pattern, handlers);
    return this;
  }

  /**
   * Adds all routes from another Router to this one.
   *
   * @param router - Another Router instance.
   */
  router(router: Router): void;

  /**
   * Adds all routes from another Router to this one.
   *
   * @param prefix - Pattern to prepend to all routes, e.g. '/users', '/admin', etc.
   * @param router - Another Router instance.
   */
  router(prefix: string, router: Router): void;

  router(...args: unknown[]) {
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
        this.#addRoute(route.meta.verb, pattern, [...router.#middleware, ...route.meta.handlers]);
      }
    } else {
      for (const route of router.routes) {
        this.#addRoute(route.meta.verb, route.pattern, [...router.#middleware, ...route.meta.handlers]);
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

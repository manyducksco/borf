import { Type, Router as BedrockRouter } from "@borf/bedrock";
import { Request } from "./Request.js";
import { Response } from "./Response.js";

type NextCallback = () => Promise<void>;

type RouteHandler = <T>(req: Request, res: Response, next: NextCallback) => T;

export type Route = {
  verb: string;
  pattern: string;
  handlers: RouteHandler[]; // Includes middleware and final handler.
};

export class Router {
  #router = new BedrockRouter<Route>();

  /**
   * A list of all routes registered to this Router.
   */
  get routes() {
    return this.#router.routes;
  }

  /**
   * Responds to HTTP GET requests that match this URL pattern.
   */
  onGet(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "GET", pattern, handlers });
    return this;
  }

  /**
   * Responds to HTTP POST requests that match this URL pattern.
   */
  onPost(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "POST", pattern, handlers });
    return this;
  }

  /**
   * Responds to HTTP PUT requests that match this URL pattern.
   */
  onPut(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "PUT", pattern, handlers });
    return this;
  }

  /**
   * Responds to HTTP PATCH requests that match this URL pattern.
   */
  onPatch(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "PATCH", pattern, handlers });
    return this;
  }

  /**
   * Responds to HTTP DELETE requests that match this URL pattern.
   */
  onDelete(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "DELETE", pattern, handlers });
    return this;
  }

  /**
   * Responds to HTTP HEAD requests that match this URL pattern.
   */
  onHead(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "HEAD", pattern, handlers });
    return this;
  }

  /**
   * Responds to HTTP OPTIONS requests that match this URL pattern.
   */
  onOptions(pattern: string, ...handlers: RouteHandler[]) {
    this.#router.addRoute(pattern, { verb: "OPTIONS", pattern, handlers });
    return this;
  }

  /**
   * Adds all routes from another Router to this one.
   *
   * @param router - Another Router instance.
   */
  addRouter(router: Router): void;

  /**
   * Adds all routes from another Router to this one.
   *
   * @param prefix - Pattern to prepend to all routes, e.g. '/users', '/admin', etc.
   * @param router - Another Router instance.
   */
  addRouter(prefix: string, router: Router): void;

  addRouter(...args: unknown[]) {
    let prefix: string | undefined;

    if (Type.isString(args[0])) {
      prefix = args.shift() as string;
    }

    Type.assertInstanceOf(Router, args[0], "Expected a Router. Got type: %t, value: %v");
    const router = args[0] as Router;

    if (prefix) {
      // Prepend pattern to all routes.
      for (const route of router.routes) {
        const pattern = BedrockRouter.joinPath([prefix, route.pattern]);
        this.#router.addRoute(pattern, { ...route.meta, pattern });
      }
    } else {
      for (const route of router.routes) {
        this.#router.addRoute(route.pattern, route.meta);
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

    const matched = this.#router.match(path, {
      willMatch: (route) => route.meta.verb === verb,
    });

    return matched;
  }
}

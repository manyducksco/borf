import { isObject, isFunction, isString, isTemplate } from "../../helpers/typeChecking.js";
import { matchRoute, parseRoute, sortRoutes } from "../../helpers/routing.js";
import { initGlobal } from "../../helpers/initGlobal.js";
import { makeDebug } from "../../helpers/makeDebug.js";

import { Request } from "../../objects/Request.js";
import { Response } from "../../objects/Response.js";

/**
 * Wraps a router (created with makeRouter) in a test wrapper.
 * The wrapper supplies mock globals and provides methods for calling the routes.
 */
export function wrapRouter(router, configFn) {
  const appContext = {
    globals: {},
    routes: sortRoutes(
      router._routes.map((r) => {
        return {
          ...parseRoute(r.url),
          method: r.method,
          handlers: router._middlewares.concat(r.handlers),
        };
      })
    ),
    debug: makeDebug(),
  };

  let initialized = false;
  const globals = [];

  async function makeRequest(method, path, config) {
    if (!initialized) {
      for (const { name, fn } of globals) {
        appContext.globals[name] = await initGlobal(fn, { appContext, name });
      }
      initialized = true;
    }

    const matched = matchRoute(appContext.routes, path, {
      willMatch: (route) => {
        return route.method === method;
      },
    });

    if (!matched) {
      throw new Error(`No route for path '${path}' is registered on this router.`);
    }

    const mockReq = {
      headers: config.headers ?? {},
      url: path,
      method,
      socket: {
        encrypted: false,
      },
    };

    const request = new Request(mockReq, matched);
    const response = new Response();

    request.body = config.body;

    const ctx = {
      cache: {},
      global(name) {
        if (!isString(name)) {
          throw new Error(`Expected a string for global name. Got: ${name}`);
        }

        if (appContext.globals[name]) {
          return appContext.globals[name].exports;
        }

        throw new Error(`Global '${name}' is not registered on this app.`);
      },
      request,
      response,
      redirect(to, statusCode = 301) {
        response.status = statusCode;
        response.headers.set("Location", to);
      },
    };

    let index = -1;
    const { handlers } = matched.data;

    const nextFunc = async () => {
      index++;
      let current = handlers[index];

      ctx.next = index === handlers.length - 1 ? undefined : nextFunc;
      ctx.response.body = (await current(ctx)) || ctx.response.body;
    };

    try {
      await nextFunc();
    } catch (err) {
      ctx.response.status = 500;
      ctx.response.body = {
        error: {
          message: err.message,
          stack: err.stack,
        },
      };

      console.error(err);
    }

    // Automatically handle content-type and body formatting when returned from handler function.
    if (ctx.response.body) {
      if (isTemplate(ctx.response.body)) {
        ctx.response.headers.set("content-type", "text/html");
        ctx.response.body = await ctx.response.body.render();
      } else if (isString(ctx.response.body)) {
        ctx.response.headers.set("content-type", "text/plain");
      } else if (!ctx.response.headers.has("content-type")) {
        ctx.response.headers.set("content-type", "application/json");
        ctx.response.body = JSON.parse(JSON.stringify(ctx.response.body));
      }
    }

    return {
      status: ctx.response.status,
      headers: ctx.response.headers.toJSON(),
      body: ctx.response.body,
    };
  }

  const ctx = {
    global(name, fn) {
      if (isObject(fn)) {
        const obj = fn;
        fn = () => obj;
      }

      if (!isFunction(fn)) {
        throw new Error(`Expected a global function for '${name}'`);
      }

      globals.push({ name, fn });

      return ctx;
    },
  };

  configFn(ctx);

  return {
    async get(path, config) {
      return makeRequest("GET", path, config);
    },
    async post(path, config) {
      return makeRequest("POST", path, config);
    },
    async put(path, config) {
      return makeRequest("PUT", path, config);
    },
    async patch(path, config) {
      return makeRequest("PATCH", path, config);
    },
    async delete(path, config) {
      return makeRequest("DELETE", path, config);
    },
    async head(path, config) {
      return makeRequest("HEAD", path, config);
    },
  };
}

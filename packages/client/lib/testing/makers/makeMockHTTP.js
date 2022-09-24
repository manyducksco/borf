import { makeMockFetch } from "./makeMockFetch.js";
import { initGlobal } from "../../helpers/initGlobal.js";

import http from "../../globals/http.js";

/**
 * @example
 * import { makeMockHTTP, wrapComponent } from "@woofjs/client/testing";
 *
 * // Create a mock HTTP instance
 * const http = makeMockHTTP(function () {
 *   this.get("/example/route", (ctx) => {
 *     return {
 *       message: "success"
 *     };
 *   });
 *
 *   this.post("/users/:id", (ctx) => {
 *     ctx.response.status = 200;
 *
 *     return {
 *       message: "user created"
 *     };
 *   });
 * });
 *
 * const createComponent = wrapComponent(TestComponent, function () {
 *   this.service("http", http);
 * });
 */
export function makeMockHTTP(fn) {
  const fetch = makeMockFetch(fn);

  return function () {
    const appContext = {
      globals: {
        debug: {
          exports: {
            channel() {
              return {
                log() {},
                warn() {},
                error() {},
              };
            },
          },
        },
      },
      options: {
        http: {
          _fetch: fetch,
        },
      },
    };

    return initGlobal(http, { appContext, channelPrefix: "mock:global", name: "http" }).exports;
  };
}

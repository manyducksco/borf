import { isFunction } from "../../helpers/typeChecking.js";
import { initGlobal } from "../../global/helpers/initGlobal.js";

import debug from "../../helpers/makeDebug.js";
import http from "../mocks/globals/http.js";
import page from "../mocks/globals/page.js";
import router from "../mocks/globals/router.js";

/**
 * Creates a service in a mock container for testing purposes.
 */
export function wrapGlobal(globalFn, configFn) {
  if (!isFunction(globalFn)) {
    throw new Error(`Expected a service function as the first argument.`);
  }

  const appContext = {
    options: {},
    globals: {},
  };

  const onBeforeConnect = [];
  const onAfterConnect = [];

  const ctx = {
    global(name, fn) {
      if (!isFunction(fn)) {
        throw new Error(`Expected a global function for '${name}'`);
      }

      const global = initGlobal(fn, { appContext, name });
      appContext.globals[name] = global;

      onBeforeConnect.push(global.beforeConnect);
      onAfterConnect.push(global.afterConnect);

      return ctx;
    },
  };

  ctx.global("debug", debug);
  ctx.global("router", router);
  ctx.global("page", page);
  ctx.global("http", http);

  for (const callback of onBeforeConnect) {
    callback();
  }

  configFn(ctx);

  for (const callback of onAfterConnect) {
    callback();
  }

  return initGlobal(globalFn, { appContext, name: "wrapped" });
}

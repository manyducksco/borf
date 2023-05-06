import { getCurrentContext } from "../classes/App/makeRequestListener.js";
import { type Headers } from "../classes/Headers.js";

/**
 * Returns the current request context. These values will be used to construct a response.
 */
export function useContext() {
  const ctx = getCurrentContext();

  return {
    get status() {
      return ctx.response.status;
    },
    set status(value) {
      ctx.response.status = value;
    },
    headers: ctx.response.headers,
    next: ctx.next ?? (async () => ctx.response.body),
  };
}

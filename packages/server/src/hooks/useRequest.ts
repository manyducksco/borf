import { getCurrentContext } from "../classes/App/makeRequestListener.js";

/**
 * Returns info on the request being handled.
 */
export function useRequest() {
  const ctx = getCurrentContext();
  return ctx.request;
}

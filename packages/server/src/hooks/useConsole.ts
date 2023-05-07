import { getCurrentContext } from "../classes/App/makeRequestListener.js";

export function useConsole() {
  const ctx = getCurrentContext();
  return ctx.debugChannel;
}

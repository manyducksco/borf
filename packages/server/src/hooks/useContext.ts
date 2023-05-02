import { Headers } from "../classes/Headers.js";

/**
 * Returns the current request context. These values will be used to construct a response.
 */
export function useContext() {
  return {
    status: 200,
    statusText: "OK",
    headers: new Headers(),
  };
}

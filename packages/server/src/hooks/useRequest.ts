import { Headers } from "../classes/Headers.js";

/**
 * Returns info on the request being handled.
 */
export function useRequest() {
  return {
    pattern: "/replace/{data}",
    location: new Location(),
    params: { data: "me" },
    query: { valueOne: 1 },
    headers: new Headers(),
    body: { example: true },
  };
}

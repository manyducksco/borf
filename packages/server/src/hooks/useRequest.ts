import { Headers } from "../classes/Headers.js";

/**
 * Returns info on the request being handled.
 */
export function useRequest() {
  return {
    pattern: "/replace/{data}",
    domain: "whatever.com",
    protocol: "http",
    path: "/test",
    params: { data: "me" },
    query: { valueOne: 1 },
    headers: new Headers(),
    body: { example: true },
  };
}

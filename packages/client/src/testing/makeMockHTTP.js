import HTTPService from "../services/@http.js";
import { makeDebug } from "../makeDebug.js";
import { makeMockFetch } from "./makeMockFetch.js";

/**
 * @example
 * import { makeMockHTTP, wrapComponent } from "@woofjs/app/testing";
 *
 * // Create a mock HTTP instance
 * const http = makeMockHTTP((self) => {
 *   self.get("/example/route", (req, res) => {
 *     res.json({
 *       message: "success"
 *     });
 *   });
 *
 *   self.post("/users/:id", (req, res) => {
 *     res.status(200).json({
 *       message: "user created"
 *     });
 *   });
 * });
 *
 * const createComponent = wrapComponent(TestComponent, (self) => {
 *   self.service("@http", http);
 * });
 */
export function makeMockHTTP(fn) {
  const debug = makeDebug();
  const fetch = makeMockFetch(fn);

  const service = HTTPService.create({
    getService: () => {},
    debugChannel: debug.makeChannel("woof:service:@http:mock"),
    options: { fetch },
  });

  return service;
}

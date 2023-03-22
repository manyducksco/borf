import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import type { RouteMatch } from "@borf/bedrock";

import { Headers } from "./Headers.js";

/**
 * A request from a client.
 */
export class Request<Body = never> {
  verb: string;
  url: string | undefined;
  path: string;
  params: Record<string, string | number | boolean>;
  query: Record<string, string | number | boolean>;
  headers: Headers;
  body?: Body;
  socket: Socket;

  /**
   * @param req - Node http.IncomingRequest object
   * @param route - Matched route object
   */
  constructor(req: IncomingMessage, route: RouteMatch) {
    this.headers = new Headers(req.headers);

    this.url = req.url!;
    this.verb = req.method!;
    this.socket = req.socket;

    this.path = route.path;
    this.params = route.params;
    this.query = route.query;
  }

  // get protocol() {
  //   const proto = this.socket.encrypted ? "https" : "http";
  //   const header = this.headers.get("X-Forwarded-Proto") || proto;
  //   const index = header.indexOf(",");

  //   return index !== -1 ? header.substring(0, index).trim() : header.trim();
  // }
}

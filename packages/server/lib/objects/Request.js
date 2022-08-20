import { Headers } from "./Headers.js";

export class Request {
  url;
  path;
  params;
  query;
  method;
  headers;
  body;
  socket;

  /**
   * @param req - Node http.IncomingRequest object
   * @param route - Matched route object
   */
  constructor(req, route) {
    this.headers = new Headers(req.headers);

    this.url = req.url;
    this.method = req.method;
    this.socket = req.socket;

    this.path = route.path;
    this.params = route.params;
    this.query = route.query;
  }

  get protocol() {
    const proto = this.socket.encrypted ? "https" : "http";
    const header = this.headers.get("X-Forwarded-Proto") || proto;
    const index = header.indexOf(",");

    return index !== -1 ? header.substring(0, index).trim() : header.trim();
  }
}

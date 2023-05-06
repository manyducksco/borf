import { Headers } from "./Headers.js";

interface ResponseConfig<Body> {
  status?: number;
  headers?: Headers;
  body?: Body;
}

/**
 * A response to a client request.
 */
export class Response<Body = unknown> {
  status = 200;
  headers = new Headers();
  body?: Body;

  get statusText() {
    return statuses[this.status] ?? "";
  }

  constructor({ headers, body }: ResponseConfig<Body>) {
    if (headers) {
      this.headers = headers;
    }

    this.body = body;
  }

  redirect(to: string) {
    this.status = 303;
    this.headers.set("Location", to);
  }
}

// Mapping of status codes to status text.
const statuses: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Content Too Large",
  414: "URI Too Long",
  415: "Unsupported Media",
};

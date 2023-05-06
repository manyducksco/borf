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
  statusText = "OK";
  headers = new Headers();
  body?: Body;

  constructor({ headers, body }: ResponseConfig<Body>) {
    if (headers) {
      this.headers = headers;
    }

    this.body = body;
  }

  redirect(to: string) {
    this.status = 303;
    this.statusText = "See Other";
    this.headers.set("Location", to);
  }
}

import { Headers } from "./Headers.js";

interface ResponseConfig<Body> {
  status?: number;
  headers?: Headers;
  body: Body;
}

/**
 * A response to a client request.
 */
export class Response<Body = unknown> {
  status = 200;
  headers = new Headers();
  body: Body;

  constructor({ status, headers, body }: ResponseConfig<Body>) {
    if (status) {
      this.status = status;
    }

    if (headers) {
      this.headers = headers;
    }

    this.body = body;
  }
}

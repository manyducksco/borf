import { Headers } from "./Headers.js";

export class Response {
  status = 200;
  headers = new Headers();
  body;
}

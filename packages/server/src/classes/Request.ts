import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import type { RouteMatch } from "@borf/bedrock";
import busboy from "busboy";
import { Headers } from "./Headers.js";

/**
 * A request from a client.
 */
export class Request<Body = never> {
  verb: string;
  url: string | undefined;
  path: string;
  protocol: string;
  params: Record<string, string | number | boolean>;
  query: Record<string, string | number | boolean>;
  headers: Headers;
  socket: Socket;

  #req: IncomingMessage;
  #bodyJSON?: Body;
  #bodyForm?: Record<string, string | FormFile[]>;
  #bodyBuffer?: Buffer;

  /**
   * @param req - Node http.IncomingRequest object
   * @param route - Matched route object
   */
  constructor(req: IncomingMessage, route: RouteMatch) {
    this.headers = new Headers(req.headers);

    this.url = req.url!;
    this.verb = req.method!;
    this.socket = req.socket;
    this.protocol = req.headers.referer?.split("://")[0] ?? "http";

    this.path = route.path;
    this.params = route.params;
    this.query = route.query;

    // this.body = body;
    this.#req = req;
  }

  // get protocol() {
  //   const proto = this.socket.encrypted ? "https" : "http";
  //   const header = this.headers.get("X-Forwarded-Proto") || proto;
  //   const index = header.indexOf(",");

  //   return index !== -1 ? header.substring(0, index).trim() : header.trim();
  // }

  /**
   * Parse the request body as a buffer of bytes.
   */
  async buffer() {
    if (!this.#bodyBuffer) {
      this.#bodyBuffer = await readToBuffer(this.#req);
    }
    return this.#bodyBuffer;
  }

  /**
   * Parse the request body as plain text.
   */
  async text() {
    const buffer = await this.buffer();
    return buffer.toString();
  }

  /**
   * Parse the request body as JSON.
   */
  async json(): Promise<Body | undefined> {
    if (!this.#bodyJSON) {
      const req = this.#req;
      const contentType = req.headers["content-type"];

      if (contentType?.startsWith("application/json")) {
        const buffer = await this.buffer();
        this.#bodyJSON = JSON.parse(buffer.toString("utf8"));
      }
    }

    return this.#bodyJSON;
  }

  /**
   * Parse the request body as form data.
   */
  async form() {
    if (!this.#bodyForm) {
      const req = this.#req;
      const contentType = req.headers["content-type"];
      if (
        contentType?.startsWith("application/x-www-form-urlencoded") ||
        contentType?.startsWith("multipart/form-data")
      ) {
        this.#bodyForm = await parseFormBody(req);
      }
    }

    return this.#bodyForm;
  }
}

async function readToBuffer(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

interface FormFile {
  name: string;
  type: string;
  buffer: Buffer;
}

/**
 * Parses incoming request bodies encoded as form data.
 */
export async function parseFormBody(req: IncomingMessage) {
  type FormData = Record<string, string | FormFile[]>;

  return new Promise<FormData>((resolve, reject) => {
    const bb = busboy({ headers: req.headers });

    const form: FormData = {};

    bb.on("file", (name, file, info) => {
      const { filename, mimeType } = info;

      const buffers: Buffer[] = [];

      file
        .on("data", (data) => {
          buffers.push(data);
        })
        .on("close", () => {
          // File inputs can take multiple files and always makes them available through JS as a .files array.
          // Files here follow the same structure. Even a single file is an item in an array.
          if (!form[name]) {
            form[name] = [];
          }

          const array = form[name];
          if (Array.isArray(array)) {
            array.push({
              name: filename,
              type: mimeType,
              buffer: Buffer.concat(buffers),
            });
          }
        });
    });

    bb.on("field", (name, val, info) => {
      form[name] = val;
    });

    bb.on("close", () => {
      resolve(form);
    });

    bb.on("error", (err) => {
      reject(err);
    });

    req.pipe(bb);
  });
}

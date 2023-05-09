import { type IncomingMessage } from "http";
import { parseFormBody } from "./parseFormBody.js";

export async function parseBody(req: IncomingMessage) {
  const contentType = req.headers["content-type"];

  console.log({ contentType });

  if (contentType) {
    if (contentType.startsWith("application/json")) {
      const buffered = await readToBuffer(req);

      console.log(buffered.length);

      return JSON.parse(buffered.toString("utf8"));
    }

    if (contentType.startsWith("application/x-www-form-urlencoded") || contentType.startsWith("multipart/form-data")) {
      return parseFormBody(req);
    }
  }

  return undefined;
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

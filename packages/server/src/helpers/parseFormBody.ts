import type { IncomingMessage } from "node:http";

import busboy from "busboy";

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

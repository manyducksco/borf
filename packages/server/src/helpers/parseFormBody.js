import util from "util";

import busboy from "busboy";
import formidable from "formidable";

/**
 * Parses incoming request bodies encoded as form data.
 */
export async function parseFormBody(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });

    const form = {};

    bb.on("file", (name, file, info) => {
      const { filename, mimeType } = info;

      const buffers = [];

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

          form[name].push({
            name: filename,
            type: mimeType,
            buffer: Buffer.concat(buffers),
          });
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

// export async function parseFormBody(req) {
//   return new Promise((resolve, reject) => {
//     const form = formidable({ multiples: true });

//     form.parse(req, (err, fields, files) => {
//       if (err) {
//         reject(err);
//         return;
//       }

//       resolve({
//         ...fields,
//         ...files,
//       });
//     });
//   });
// }

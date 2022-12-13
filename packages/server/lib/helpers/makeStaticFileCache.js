import path from "node:path";
import fs from "node:fs";
import { mime } from "send";

/**
 * Generates a cache of static files for quick in-memory matching.
 *
 * @param entries - An array of entries with `{ path, source }`.
 */
export function makeStaticFileCache(entries) {
  const files = [];

  for (const entry of entries) {
    const filesList = recurseFiles(entry.source);

    for (const f of filesList) {
      const ext = path.extname(f.path).toLowerCase();

      if (ext !== ".gz") {
        const { type, charset } = getFileType(f.path);
        const gzip = filesList.find((l) => path.extname(l.path).toLowerCase() === ".gz" && l.path.startsWith(f.path));

        files.push({
          href: f.path.replace(entry.source, entry.path),
          path: f.path.replace(entry.source, ""),
          type,
          charset,
          source: entry.source,
          gz: gzip ? gzip.path.replace(entry.source, entry.path.replace(/^\//, "")) : undefined,
        });
      }
    }
  }

  return files;
}

/**
 * Returns a flat list of all files in a directory including nested folders.
 *
 * @param dir - A folder path.
 */
function recurseFiles(dir) {
  const contents = fs.readdirSync(dir);
  const files = [];

  for (const item of contents) {
    const full = path.join(dir, item);
    const stats = fs.lstatSync(full);

    if (stats.isDirectory()) {
      files.push(...recurseFiles(full));
    } else {
      files.push({ path: full });
    }
  }

  return files;
}

function getFileType(name) {
  const type = mime.lookup(name);
  const charset = mime.charsets.lookup(type);

  return {
    type,
    charset,
  };
}

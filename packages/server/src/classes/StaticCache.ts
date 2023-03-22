import type { DebugChannel } from "./DebugHub";

import path from "node:path";
import fs from "node:fs";
import { mime } from "send";

export interface StaticEntry {
  source: string;
  path: string;
}

export interface StaticFile extends StaticEntry {
  href: string;
  type: string;
  charset: string;
  gz?: string;
}

/**
 * Cache that serves from an in-memory list of static files.
 */
export class StaticCache {
  #values = new Map();

  constructor(entries: StaticEntry[], channel: DebugChannel) {
    const files = parseFileMeta(entries);

    for (const file of files) {
      this.#values.set(file.href, file);
      channel.log("added files to static cache", file);
    }
  }

  get(filePath: string) {
    return this.#values.get(filePath);
  }
}

/**
 * Generates a cache of static files for quick in-memory matching.
 *
 * @param entries - An array of entries with `{ path, source }`.
 */
function parseFileMeta(entries: StaticEntry[]): StaticFile[] {
  const files = [];

  for (const entry of entries) {
    // Get a complete list of all files in the source folder and subfolders.
    const filesList = recurseFiles(entry.source);

    for (const f of filesList) {
      const ext = path.extname(f.path).toLowerCase();

      // Generate metadata for each file.
      // Ignore gzipped files; `gz` paths are included in metadata for the original file.
      if (ext !== ".gz") {
        const { type, charset } = getFileType(f.path);
        const gzip = filesList.find((l) => path.extname(l.path).toLowerCase() === ".gz" && l.path.startsWith(f.path));

        files.push({
          href: path.normalize(f.path.replace(entry.source, entry.path)),
          path: path.normalize(f.path.replace(entry.source, "")),
          type,
          charset,
          source: entry.source,
          gz: gzip ? gzip.path.replace(entry.source, entry.path.replace(/^\//, "")) : undefined,
        });
      }
    }
  }

  // Return a flat list of one metadata object for each file found in the source folder.
  return files;
}

/**
 * Returns a flat list of all files in a directory including nested folders.
 *
 * @param dir - A folder path.
 */
function recurseFiles(dir: string) {
  const contents = fs.readdirSync(dir);
  const files: { path: string }[] = [];

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

function getFileType(name: string) {
  const type = mime.lookup(name);
  const charset = mime.charsets.lookup(type, "application/octet-stream");

  return {
    type,
    charset,
  };
}

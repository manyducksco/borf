import type { DebugChannel } from "./DebugHub";

import path from "node:path";
import fs from "node:fs";
import { mime } from "send";

export interface StaticEntry {
  /**
   * The path fragment these files will be served from.
   */
  path: string;

  /**
   * The directory on disk where the files exist.
   */
  source: string;
}

export interface StaticFile extends StaticEntry {
  href: string;
  type?: string;
  charset?: string;
  gz?: string;
}

export interface Cache {
  get(filePath: string): StaticFile | undefined;
  addEntry(entry: StaticEntry): void;
}

/**
 * Holds a cache of static files for quick in-memory matching.
 */
export class StaticCache implements Cache {
  #values = new Map<string, StaticFile>();

  get(filePath: string) {
    return this.#values.get(filePath);
  }

  addEntry(entry: StaticEntry) {
    // Get a complete list of all files in the source folder and subfolders.
    const filesList = recurseFiles(entry.source);

    for (const f of filesList) {
      const ext = path.extname(f.path).toLowerCase();

      // Generate metadata for each file.
      // Ignore gzipped files; `gz` paths are included in metadata for the original file.
      if (ext !== ".gz") {
        const type = mime.lookup(f.path);
        const charset = mime.charsets.lookup(type, "application/octet-stream");
        const gzip = filesList.find((l) => path.extname(l.path).toLowerCase() === ".gz" && l.path.startsWith(f.path));
        const href = path.normalize(f.path.replace(entry.source, entry.path));
        const file = {
          href,
          path: path.normalize(f.path.replace(entry.source, "")),
          type,
          charset,
          source: entry.source,
          gz: gzip ? gzip.path.replace(entry.source, entry.path.replace(/^\//, "")) : undefined,
        };

        this.#values.set(href, file);
      }
    }
  }
}

/**
 * Reads from disk each time to check if files exist for a route.
 */
export class NoCache implements Cache {
  #entries: StaticEntry[] = [];

  get(filePath: string) {
    for (const entry of this.#entries) {
      if (!filePath.startsWith(entry.path)) {
        continue;
      }

      const fileName = filePath.replace(entry.path, "");
      const targetPath = path.join(entry.source, fileName);

      if (fs.existsSync(targetPath)) {
        const hasGZ = fs.existsSync(targetPath + ".gz");

        return {
          source: entry.source,
          path: fileName,
          href: filePath,
          gz: hasGZ ? filePath + ".gz" : undefined,
        };
      }
    }
  }

  addEntry(entry: StaticEntry) {
    this.#entries.push(entry);
  }
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

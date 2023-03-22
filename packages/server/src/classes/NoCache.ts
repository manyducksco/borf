import type { StaticEntry } from "./StaticCache";

import path from "node:path";
import fs from "node:fs";

/**
 * Reads from disk each time to check if files exist for a route.
 */
export class NoCache {
  #entries: StaticEntry[];

  constructor(entries: StaticEntry[]) {
    this.#entries = entries;
  }

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
          gz: hasGZ ? filePath + ".gz" : null,
        };
      }
    }
  }
}

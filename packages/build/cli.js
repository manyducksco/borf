#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs/promises";
import { program } from "@ratwizard/cli";
import { Type } from "@borf/bedrock";
import { Builder } from "./lib/index.js";
import log from "./lib/utils/log.js";

program
  .option("-w, --watch", {
    description: "Watch for changes and rebuild automatically.",
    boolean: true,
  })
  .option("--minify", {
    description:
      "Reduce bundle size at the cost of readability; recommended for production builds. Only affects the client app.",
    boolean: true,
  })
  .option("--compress", {
    description: "Pre-compress assets with GZIP compression during build.",
    boolean: true,
  })
  .option("--relative-bundle-paths", {
    description:
      "Use paths relative to index.html for importing client bundle files instead of the default absolute paths.",
    key: "relativeBundlePaths",
    boolean: true,
  })
  .action(async ({ options }) => {
    const buildOptions = {
      minify: options.minify || false,
      compress: options.compress || false,
      relativeBundlePaths: options.relativeBundlePaths || false,
    };

    const builder = await getProjectBuilder(process.cwd());

    if (options.watch) {
      const watcher = builder.watch(process.cwd(), buildOptions);
      // watcher.cancel();
    } else {
      await builder.build(process.cwd(), buildOptions);
    }
  })
  .run(process.argv);

async function getProjectBuilder(projectRoot) {
  const contents = await fs.readdir(projectRoot);
  const regexp = /^borf\.build\.js/i;

  for (const name of contents) {
    if (regexp.test(name)) {
      const imported = await import(path.join(projectRoot, name));

      if (Type.isObject(imported.default)) {
        return new Builder(projectRoot, imported.default);
      }

      if (Type.isInstanceOf(Builder, imported.default)) {
        return new Builder(projectRoot, imported.default.config);
      }
    }
  }

  log.build(
    `borf.build.js was not found in project root. Using default configuration.`
  );
  return new Builder(projectRoot, {});
}

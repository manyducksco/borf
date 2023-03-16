#!/usr/bin/env node

import { program } from "@ratwizard/cli";
import { Builder } from "./lib/index.js";

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

    // TODO: Read project build config and pass that object to Builder:
    const builder = new Builder(/* config */);

    if (options.watch) {
      const watcher = builder.watch(process.cwd(), buildOptions);
      // watcher.cancel();
    } else {
      await builder.build(process.cwd(), buildOptions);
    }
  })
  .run(process.argv);

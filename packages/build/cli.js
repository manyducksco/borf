#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs/promises";
import { program } from "@ratwizard/cli";
import { Type } from "@borf/bedrock";
import { Builder } from "./lib/index.js";
import log from "./lib/log.js";

program
  .option("-w, --watch", {
    description: "Watch for changes and rebuild automatically.",
    boolean: true,
  })
  .option("-c, --config <path>", {
    description: "Build with a specific config file.",
  })
  .option("--production", {
    description: "Build for production with optimizations enabled.",
  })
  .action(async ({ options }) => {
    const builder = await getProjectBuilder(process.cwd(), options.config);

    if (options.watch) {
      await builder.watch();
    } else {
      await builder.build();
    }
  })
  .run(process.argv);

async function getProjectBuilder(projectRoot, configPath) {
  if (configPath) {
    const imported = await import(configPath);
    const config = imported.default;

    if (Type.isObject(config)) {
      return new Builder(projectRoot, config);
    }

    if (Type.isInstanceOf(Builder, config)) {
      return new Builder(projectRoot, config.config);
    }

    throw new TypeError(
      `Build config must return a config object. Got type: ${Type.of(
        config
      )}, value: ${config}`
    );
  }

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

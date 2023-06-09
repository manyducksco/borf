#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs/promises";
import { program } from "@ratwizard/cli";
import { isObject, typeOf } from "@borf/bedrock";
import { Builder } from "./Builder.js";
import log from "./log.js";

program
  .command("serve", {
    options: {
      "-c, --config <path>": {
        description: "Build with a specific config file.",
      },
      "--production": {
        description: "Build for production with optimizations enabled.",
        boolean: true,
      },
    },
    action: async ({ options }) => {
      const builder = await getProjectBuilder(process.cwd(), options.config);
      await builder.watch();
    },
  })
  .command("build", {
    options: {
      "-c, --config <path>": {
        description: "Build with a specific config file.",
      },
      "--production": {
        description: "Build for production with optimizations enabled.",
        boolean: true,
      },
    },
    action: async ({ options }) => {
      const builder = await getProjectBuilder(process.cwd(), options.config);
      await builder.build();
    },
  })
  .command("view", {
    options: {},
    action: async ({ options }) => {
      console.log("NOT YET IMPLEMENTED");
    },
  })
  .run(process.argv);

async function getProjectBuilder(projectRoot: string, configPath: string) {
  if (configPath) {
    const imported = await import(configPath);
    const config = imported.default;

    if (isObject(config)) {
      return new Builder(projectRoot, config);
    }

    if (config instanceof Builder) {
      return new Builder(projectRoot, config.config);
    }

    throw new TypeError(
      `Build config must return a config object. Got type: ${typeOf(
        config
      )}, value: ${config}`
    );
  }

  const contents = await fs.readdir(projectRoot);
  const regexp = /^borf\.build\.js/i;

  for (const name of contents) {
    if (regexp.test(name)) {
      const imported = await import(path.join(projectRoot, name));

      if (isObject(imported.default)) {
        return new Builder(projectRoot, imported.default);
      }

      if (imported.default instanceof Builder) {
        return new Builder(projectRoot, imported.default.config);
      }
    }
  }

  log.build(
    `borf.build.js was not found in project root. Using default configuration.`
  );
  return new Builder(projectRoot, {});
}

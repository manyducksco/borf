#!/usr/bin/env node

import { program } from "@ratwizard/cli";
import { getProjectBuilder } from "./getProjectBuilder.js";

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

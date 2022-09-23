#!/usr/bin/env node

import { program } from "@ratwizard/cli";
import path from "path";

import findWoofConfig from "./utils/findWoofConfig.js";
import serve from "./scripts/serve.js";

program
  .command("start", {
    description: "starts an HTTP server for views",
    examples: [
      "{*} ./client",
      "{*} ./client --include-styles client/styles/global.css,client/styles/ui.css",
    ],
    options: {
      "--include-styles <paths>": {
        description: "path to CSS files to include, comma separated",
        key: "includeStyles",
      },
    },
    args: [
      {
        name: "path",
        description: "root directory of your app",
      },
    ],
    action: async ({ args, options }) => {
      const woofConfig = await findWoofConfig();

      const includeStyles = [];

      // Add styles from CLI argument.
      if (options.includeStyles) {
        includeStyles.push(
          ...options.includeStyles.split(",").filter((x) => x.trim() !== "")
        );
      }

      // Add styles from woof config file.
      if (woofConfig?.view?.include?.styles) {
        includeStyles.push(
          ...woofConfig.view.include.styles.filter((x) => x.trim() !== "")
        );
      }

      await serve({
        ...(woofConfig?.build || {}),
        clientRoot: path.resolve(args.path),
        buildRoot: path.join(process.cwd(), "temp", "views"),
        projectViewStaticRoot: path.join(process.cwd(), ".window", "static"), // Replace the window index.html.mustache and/or include extra files for your project.
        include: {
          styles: includeStyles,
        },
      });
    },
  })
  .run(process.argv);

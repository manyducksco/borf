#!/usr/bin/env node

const { program } = require("@ratwizard/cli");

program
  .command("blueprints", {
    description: "Prints a list of available blueprints",
    path: "./commands/blueprints/command.js",
  })
  .command("generate", {
    description: "Creates project file boilterplate from blueprints",
    path: "./commands/generate/command.js",
  })
  .command("miru", {
    description: "Starts in-browser testing environment",
    path: "./commands/miru/command.js",
  })
  .run(process.argv);

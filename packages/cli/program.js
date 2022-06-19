#!/usr/bin/env node

const path = require("path");
const { program } = require("@ratwizard/cli");

// Print the version from package.json when called with --version flag
program.version(require("./package.json").version);

program
  .command("generate", {
    alias: "g",
    description: "Generates boilerplate project files from blueprints",
    path: path.join(__dirname, "./commands/generate/command.js"),
  })
  .command("blueprints", {
    description: "Prints a list of available blueprints",
    path: path.join(__dirname, "./commands/blueprints/command.js"),
  });

program.run(process.argv);

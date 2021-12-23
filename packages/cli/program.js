#!/usr/bin/env node

const { program } = require("@ratwizard/cli");

program.version(require("./package.json").version);

program
  .command("start", {
    alias: "s",
    description: "Runs app for local development",
    path: "./commands/start/command.js",
  })
  .command("test", {
    alias: "t",
    description: "Runs unit tests",
    path: "./commands/test/command.js",
  })
  .command("build", {
    alias: "b",
    description: "Builds a production-ready app bundle",
    path: "./commands/build/command.js",
  })
  .command("generate", {
    alias: "g",
    description: "Generates boilerplate project files from blueprints",
    path: "./commands/generate/command.js",
  })
  .command("blueprints", {
    description: "Prints a list of available blueprints",
    path: "./commands/blueprints/command.js",
  })
  .command("routes", {
    description: "Prints a list of routes mounted on the server",
    path: "./commands/routes/command.js",
  });

program.run(process.argv);

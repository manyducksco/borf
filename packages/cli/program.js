#!/usr/bin/env node

const { program } = require("@ratwizard/cli");

program
  .command("start", {
    description: "Runs the app for local development",
    path: "./commands/start/command.js",
  })
  .command("test", {
    description: "Runs unit tests",
    path: "./commands/test/command.js",
  })
  .command("build", {
    description: "Creates a production-ready app bundle",
    path: "./commands/build/command.js",
  })
  .command("generate", {
    description: "Generates project file boilerplate from blueprints",
    path: "./commands/generate/command.js",
  })
  .command("blueprints", {
    description: "Prints a list of available blueprints",
    path: "./commands/blueprints/command.js",
  })
  .command("routes", {
    description: "Lists all routes mounted on the server",
    path: "./commands/routes/command.js",
  })

  .run(process.argv);

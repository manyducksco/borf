#!/usr/bin/env node

const path = require("path");
const { program } = require("@ratwizard/cli");

// Print the version from package.json when called with --version flag
program.version(require("./package.json").version);

program
  .command("start", {
    alias: "s",
    description: "Runs app for local development",
    path: path.join(__dirname, "./commands/start/command.js"),
  })
  // .command("test", {
  //   alias: "t",
  //   description: "Runs unit tests",
  //   path: path.join(__dirname, "./commands/test/command.js"),
  // })
  .command("build", {
    alias: "b",
    description: "Builds a production-ready app bundle",
    path: path.join(__dirname, "./commands/build/command.js"),
  })
  .command("generate", {
    alias: "g",
    description: "Generates boilerplate project files from blueprints",
    path: path.join(__dirname, "./commands/generate/command.js"),
  })
  .command("blueprints", {
    description: "Prints a list of available blueprints",
    path: path.join(__dirname, "./commands/blueprints/command.js"),
  });
// .command("routes", {
//   description: "Prints a list of routes mounted on the server",
//   path: path.join(__dirname, "./commands/routes/command.js"),
// });

program.run(process.argv);

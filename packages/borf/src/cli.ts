#!/usr/bin/env node

import yargs from "yargs";

import { serveCommand } from "./commands/serve.js";

yargs
  .scriptName("borf")
  .usage("$0 <command>")
  .command(
    "serve",
    "Start a dev server",
    (yargs) => {},
    (argv) => {
      serveCommand({});
    }
  )
  .command(
    "build",
    "Build app for deployment",
    (yargs) => {},
    (argv) => {
      console.log("Not yet implemented.");
    }
  )
  .command(
    "viewer",
    "Start front-end component viewer",
    (yargs) => {},
    (argv) => {
      console.log("Not yet implemented.");
    }
  )
  .help().argv;

import { configure } from "borf";

export default configure({
  // build options

  browser: {
    entry: "./app/browser/something-else.html",
  },
  server: {
    entry: "./app/server/random-entrypoint.ts",
  },
});

import { Builder } from "borf";

export default Builder.configure({
  browser: {
    entry: "./browser/app.jsx",
  },
  server: {
    entry: "./server/app.js",
  },
});

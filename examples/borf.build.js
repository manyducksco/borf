import { Builder } from "@borf/build";

export default Builder.configure({
  browser: {
    entry: "./browser/app.jsx",
  },
  // server: {
  //   entry: "./server/app.js",
  // },
});

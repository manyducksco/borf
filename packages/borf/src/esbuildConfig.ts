import type { BuildOptions } from "esbuild";

import { merge } from "lodash-es";

export function makeConfig(options?: BuildOptions): BuildOptions {
  const defaults = {
    bundle: true,
    sourcemap: true,
    write: false,
    target: "es2022",
    format: "iife",
    loader: {
      ".js": "jsx",
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".svg": "file",
      ".webp": "file",
      ".ttf": "file",
      ".otf": "file",
      ".woff": "file",
      ".woff2": "file",
    },
    jsx: "automatic",
    jsxImportSource: "@borf/browser",
  };

  return merge(defaults, options);
}

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ESBuild default config options for the client build process.
 */
export default {
  // entryPoints: [config.entryPath],
  // entryNames: "[dir]/[name].[hash]",
  bundle: true,
  sourcemap: true,
  write: false,
  target: "es2018",
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
  jsxImportSource: "woofe",
};

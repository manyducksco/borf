import { h } from "./h";
import path from "path";

// This will exist alongside the server.js file this is bundled into when the app is built.
const manifest = require(path.join(__dirname, "static.json"));

/**
 * Represents a full HTML page. Wrap your component with this if rendering a standalone page.
 * Includes links to component styles and other files generated during the build process.
 */
export function Page() {
  return h("html", [
    h("head", [
      manifest.styles.map((file) => {
        return h("link", { rel: "stylesheet", href: file });
      }),
    ]),
    h("body", this.children),
  ]);
}

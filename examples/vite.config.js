import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@borf/browser",
  },
  test: {
    browser: {
      enabled: true,
      name: "chrome",
    },
  },
  server: {
    port: 9000,
  },
});

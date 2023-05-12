import { createServer } from "vite";

interface CommandConfig {}

export async function serveCommand(config: CommandConfig) {
  // Serves client from localhost:9000
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    server: {
      port: 9000,
    },
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "@borf/browser",
    },
  });
  await server.listen();

  server.printUrls();

  // TODO: Run server from a different port and set up a proxy.
}

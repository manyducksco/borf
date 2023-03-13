import fs from "fs-extra";
import path from "path";
import esbuild from "esbuild";
import stylePlugin from "esbuild-style-plugin";

import log from "./utils/log.js";
import esbuildConfig from "./utils/esbuildConfig.js";
import { generateScopedClassName } from "./utils/generateScopedClassName.js";
import { writeClientFiles } from "./utils/writeClientFiles.js";
import { writeStaticFiles } from "./utils/writeStaticFiles.js";
import { makeTimer } from "./utils/timer.js";

export async function build(projectRoot, buildOptions) {
  let woofConfig = {};

  try {
    woofConfig = (await import(path.join(projectRoot, "builde.config.js")))
      .default;
  } catch {}

  const clientEntryPath = getClientEntryPath(projectRoot, woofConfig);
  const staticPath = path.join(projectRoot, "static");
  const buildPath = path.join(projectRoot, "build");
  const buildStaticPath = path.join(buildPath, "static");

  await fs.emptyDir(buildPath);
  log.build("cleaned build folder");

  /*============================*\
  ||          /client           ||
  \*============================*/

  if (clientEntryPath) {
    const time = makeTimer();

    const clientBundle = await esbuild.build({
      ...esbuildConfig,
      entryPoints: [clientEntryPath],
      entryNames: "[dir]/client.[hash]",
      outdir: buildStaticPath,
      minify: buildOptions.minify,
      plugins: [
        stylePlugin({
          postcss: {
            plugins: woofConfig.client?.postcss?.plugins || [],
          },
          cssModulesOptions: {
            generateScopedName: generateScopedClassName,
          },
        }),
      ],
    });

    await writeClientFiles({
      clientBundle,
      projectRoot,
      staticPath,
      buildStaticPath,
      clientEntryPath,
      buildOptions,
    });

    log.client("built in", "%c" + time());
  }

  /*============================*\
  ||          /static           ||
  \*============================*/

  const end = makeTimer();

  const staticFiles = await writeStaticFiles({
    projectRoot,
    buildPath,
    staticPath,
    buildStaticPath,
    clientEntryPath,
    buildOptions,
  });

  const time = end();

  if (staticFiles.length > 0) {
    log.static("built in", "%c" + time);
  }
}

function getClientEntryPath(projectRoot, woofConfig) {
  // Use custom entry path from woof config if provided.
  // if (woofConfig.client?.entryPath) {
  //   return path.resolve(projectRoot, woofConfig.client.entryPath);
  // }

  const clientFolder = path.join(projectRoot, "client");

  if (fs.existsSync(clientFolder)) {
    for (const fileName of fs.readdirSync(clientFolder)) {
      if (/^app.[jt]sx?$/.test(fileName)) {
        return path.join(clientFolder, fileName);
      }
    }
  }
}

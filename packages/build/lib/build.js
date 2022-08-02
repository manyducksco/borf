import { println } from "@ratwizard/cli";
import fs from "fs-extra";
import path from "path";
import esbuild from "esbuild";
import xxhash from "xxhashjs";
import cheerio from "cheerio";
import pako from "pako";
import superbytes from "superbytes";
import htmlMinifier from "html-minifier";
import stylePlugin from "esbuild-style-plugin";
import esbuildConfig from "./esbuildConfig.js";

export async function build(projectRoot, buildOptions) {
  let woofConfig = {};

  try {
    woofConfig = (await import(path.join(projectRoot, "woof.config.js")))
      .default;
  } catch {}

  const clientEntryPath = getClientEntryPath(projectRoot, woofConfig);
  const staticPath = path.join(projectRoot, "static");
  const buildPath = path.join(projectRoot, "build");
  const buildStaticPath = path.join(buildPath, "static");

  await fs.emptyDir(buildPath);
  println(`<blue>[build]</blue> cleaned build folder`);

  /*============================*\
  ||          /client           ||
  \*============================*/

  if (clientEntryPath) {
    const start = Date.now();

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
            generateScopedName: function (name, filename, css) {
              const file = path.basename(filename, ".module.css");
              const hash = xxhash
                .h64()
                .update(css)
                .digest()
                .toString(16)
                .slice(0, 5);

              return file + "_" + name + "_" + hash;
            },
          },
        }),
      ],
    });

    /* ----- Write Client Files ----- */

    const writtenFiles = [];

    for (const file of clientBundle.outputFiles) {
      let filePath;

      if (/\.css(\.map)?$/.test(file.path)) {
        filePath = file.path.replace(
          buildStaticPath,
          path.join(buildStaticPath, "css")
        );
      } else if (/\.js(\.map)?$/.test(file.path)) {
        filePath = file.path.replace(
          buildStaticPath,
          path.join(buildStaticPath, "js")
        );
      } else {
        filePath = file.path;
      }

      fs.mkdirpSync(path.dirname(filePath));

      if (filePath.endsWith(".js") || filePath.endsWith(".css")) {
        fs.writeFileSync(filePath, file.contents);

        const size = superbytes(file.contents.length);
        println(
          `<green>[client]</green> wrote ${filePath.replace(
            projectRoot,
            ""
          )} <green>(${size})</green>`
        );

        if (buildOptions.compress) {
          const writePath = filePath + ".gz";
          const contents = pako.gzip(file.contents, {
            level: 9,
          });
          fs.writeFileSync(writePath, contents);

          const size = superbytes(contents.length);
          println(
            `<green>[client]</green> wrote ${writePath.replace(
              projectRoot,
              ""
            )} <green>(${size})</green>`
          );
        }
      } else {
        fs.writeFileSync(filePath, file.contents);

        println(
          `<green>[client]</green> wrote ${filePath.replace(projectRoot, "")}`
        );
      }

      writtenFiles.push({
        ...file,
        path: filePath,
      });
    }

    // Write index.html
    try {
      const index = fs.readFileSync(path.join(staticPath, "index.html"));
      const $ = cheerio.load(index);

      const styles = writtenFiles.filter(
        (file) => path.extname(file.path) === ".css"
      );
      const scripts = writtenFiles.filter(
        (file) => path.extname(file.path) === ".js"
      );

      // Add styles to head.
      for (const file of styles) {
        let href = file.path.replace(buildStaticPath, "");

        if (buildOptions.relativeBundlePaths) {
          href = "." + href;
        }

        $("head").append(`<link rel="stylesheet" href="${href}">`);
      }

      // Add scripts to body.
      for (const file of scripts) {
        let src = file.path.replace(buildStaticPath, "");

        if (buildOptions.relativeBundlePaths) {
          src = "." + src;
        }

        $("body").append(`<script src="${src}"></script>`);
      }

      let html = $.html();

      if (buildOptions.minify) {
        html = htmlMinifier.minify(html, {
          collapseWhitespace: true,
          conservativeCollapse: false,
          preserveLineBreaks: false,
          removeScriptTypeAttributes: true,
          minifyCSS: true,
          minifyJS: true,
        });
      }

      fs.writeFileSync(path.join(buildStaticPath, "index.html"), html);

      println(
        `<green>[client]</green> wrote ${path
          .join(buildStaticPath, "index.html")
          .replace(projectRoot, "")}`
      );

      writtenFiles.push({
        path: path.join(buildStaticPath, "index.html"),
      });
    } catch (err) {
      if (err.code === "ENOENT") {
        if (clientEntryPath) {
          println(
            `<green>[client]</green> <red>ERROR:</red> /static/index.html file not found. Please create one to serve as the entry point for your client app.`
          );
        }
      } else {
        println(`<green>[client]</green> <red>ERROR:</red> ${err.message}`);
      }
    }

    println(
      `<green>[client]</green> built in <green>${Date.now() - start}ms</green>`
    );
  }

  /*============================*\
  ||          /static           ||
  \*============================*/

  if (fs.existsSync(staticPath)) {
    const copiedFiles = [];

    fs.copySync(staticPath, path.join(buildPath, "static"), {
      filter: (src, dest) => {
        if (src.replace(staticPath, "") === "/index.html") {
          return false; // Skip index.html which is handled by client build
        }

        // Wooooo side effects
        if (src !== staticPath) {
          copiedFiles.push({ path: dest });
        }

        return true;
      },
    });

    for (const file of copiedFiles) {
      println(
        `<magenta>[static]</magenta> copied ${file.path.replace(
          projectRoot,
          ""
        )}`
      );
    }
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

function getServerEntryPath(projectRoot, woofConfig) {
  // Use custom entry path from woof config if provided.
  // if (woofConfig.server?.entryPath) {
  //   return path.resolve(projectRoot, woofConfig.server.entryPath);
  // }

  const serverFolder = path.join(projectRoot, "server");

  if (fs.existsSync(serverFolder)) {
    for (const fileName of fs.readdirSync(serverFolder)) {
      if (/^app.m?[jt]sx?$/.test(fileName)) {
        return path.join(serverFolder, fileName);
      }
    }
  }
}

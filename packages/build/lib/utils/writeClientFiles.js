import { println } from "@ratwizard/cli";
import fs from "fs-extra";
import path from "path";
import pako from "pako";
import superbytes from "superbytes";
import cheerio from "cheerio";
import htmlMinifier from "html-minifier";

import log from "./log.js";

export async function writeClientFiles({
  clientBundle,
  projectRoot,
  staticPath,
  buildStaticPath,
  clientEntryPath,
  buildOptions,
  isDevelopment = false,
}) {
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
      log.client("wrote", filePath.replace(projectRoot, ""), `%c(${size})`);

      if (buildOptions.compress) {
        const writePath = filePath + ".gz";
        const contents = pako.gzip(file.contents, {
          level: 9,
        });
        fs.writeFileSync(writePath, contents);

        const size = superbytes(contents.length);
        log.client("wrote", writePath.replace(projectRoot, ""), `%c(${size})`);
      }
    } else {
      fs.writeFileSync(filePath, file.contents);

      log.client("wrote", filePath.replace(projectRoot, ""));
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

    // Add bundle reload listener to head.
    if (isDevelopment) {
      $("head").append(`
        <script>
          const events = new EventSource("/_bundle");
    
          events.addEventListener("message", (message) => {
            window.location.reload();
          });
    
          window.addEventListener("beforeunload", () => {
            events.close();
          });
        </script>
      `);
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

    log.client(
      "wrote",
      path.join(buildStaticPath, "index.html").replace(projectRoot, "")
    );

    writtenFiles.push({
      path: path.join(buildStaticPath, "index.html"),
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      if (clientEntryPath) {
        log.client(
          "<red>ERROR:</red>",
          "/static/index.html file not found. Please create one to serve as the entry point for your client app."
        );
      }
    } else {
      log.client("<red>ERROR:</red>", err.message);
    }
  }

  return writtenFiles;
}

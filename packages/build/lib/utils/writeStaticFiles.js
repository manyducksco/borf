import { println } from "@ratwizard/cli";
import fs from "fs-extra";
import path from "path";
import pako from "pako";
import superbytes from "superbytes";
import imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";
import imageminJpegtran from "imagemin-jpegtran";
import imageminSvgo from "imagemin-svgo";

import log from "./log.js";

export async function writeStaticFiles({
  projectRoot,
  staticPath,
  buildPath,
  buildStaticPath,
  clientEntryPath,
  buildOptions,
}) {
  const writtenFiles = [];

  if (fs.existsSync(staticPath)) {
    const copiedFiles = [];
    const compressableFiles = [];
    const imageTypes = ["jpg", "jpeg", "png", "svg"];

    fs.copySync(staticPath, path.join(buildPath, "static"), {
      filter: (src, dest) => {
        if (clientEntryPath && src.replace(staticPath, "") === "/index.html") {
          return false; // Skip index.html which is handled by client build
        }

        if (buildOptions.compress) {
          const ext = path.extname(src).slice(1).toLowerCase();

          if (ext === "css" || ext === "js") {
            compressableFiles.push({ type: "gzip", src, dest });
            return false;
          }

          if (imageTypes.includes(ext)) {
            compressableFiles.push({ type: "imagemin", src, dest });
            return false;
          }
        }

        // Wooooo side effects
        if (src !== staticPath) {
          copiedFiles.push({ path: dest });
        }

        return true;
      },
    });

    for (const file of copiedFiles) {
      writtenFiles.push(file);
      log.static("copied", file.path.replace(projectRoot, ""));
    }

    const gzipFiles = compressableFiles.filter((f) => f.type === "gzip");

    for (const file of gzipFiles) {
      const contents = fs.readFileSync(file.src);

      fs.writeFileSync(file.dest, contents);
      log.static(
        "wrote " + file.dest.replace(projectRoot, ""),
        "%c" + superbytes(contents.length)
      );

      writtenFiles.push({ path: file.dest });

      const writePath = file.dest + ".gz";
      const compressed = pako.gzip(contents, {
        level: 9,
      });
      fs.writeFileSync(writePath, compressed);

      const diff = superbytes(contents.length - compressed.length);
      const size = superbytes(compressed.length);
      const printPath = writePath.replace(projectRoot, "");
      log.static("wrote", printPath, `%c${size} (-${diff})`);

      writtenFiles.push({ path: writePath });
    }

    if (buildOptions.compress) {
      const imageGlob = path.join(staticPath, `**/*.{${imageTypes.join(",")}}`);

      const optimizedFiles = await imagemin([imageGlob], {
        plugins: [
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8],
          }),
          imageminSvgo({
            plugins: [
              {
                name: "removeViewBox",
                active: false,
              },
            ],
          }),
        ],
      });

      for (const file of optimizedFiles) {
        const stat = fs.statSync(file.sourcePath);

        const outputSize = superbytes(file.data.length);
        const diffSize = superbytes(stat.size - file.data.length);

        const writePath = file.sourcePath.replace(staticPath, buildStaticPath);
        const printPath = writePath.replace(projectRoot, "");

        fs.writeFileSync(writePath, file.data);

        log.static("wrote", printPath, `%c${outputSize} (-${diffSize})`);

        writtenFiles.push({ path: writePath });
      }
    }
  }

  return writtenFiles;
}

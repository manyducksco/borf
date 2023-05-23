import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "lib",
  format: "esm",
});

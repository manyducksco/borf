module.exports = {
  client: {
    entryPoint: "client/client.js",
  },

  esbuild: {
    minify: true,
    inject: ["./jsxShim.js"], // TODO: Have this be an automatic part of the build system.
  },
};

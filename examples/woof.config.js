module.exports = {
  // Include global project CSS in views
  view: {
    include: {
      css: ["./client/styles.demo.css"],
    },
  },

  build: {
    /**
     * Specify postcss plugins to use in esbuild.
     */
    postcss: {
      plugins: [],
    },
  },
};

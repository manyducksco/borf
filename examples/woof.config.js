export default {
  // Include global project CSS in views
  view: {
    include: {
      styles: ["client/styles/demo.css"],
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

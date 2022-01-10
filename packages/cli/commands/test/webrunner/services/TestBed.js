import { makeService, makeState } from "@woofjs/app";
import setup from "$bundle";

export default makeService((self) => {
  const $selected = makeState();
  const $suites = makeState([]);

  self.beforeConnect(() => {
    setup((path, suite) => {
      $suites.set((current) => {
        current.push({ path, ...suite });
      });
    });

    self.watchState($suites, (current) => {
      console.log(current);
    });
  });

  return {
    $selected,
    $suites,

    getSuite(path) {
      return $suites.get().find((s) => s.path === path);
    },
  };
});

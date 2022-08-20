import { makeService, makeState } from "@woofjs/client";

/**
 * Exposes a $current value and increments it by one each second.
 */
export default makeService((ctx) => {
  const $current = makeState(0);

  ctx.afterConnect(() => {
    setInterval(() => {
      $current.set((current) => current + 1);
    }, 1000);
  });

  return {
    $current,

    reset() {
      $current.set(0);
    },
  };
});

import { makeGlobal, makeState } from "woofe";

/**
 * Exposes a $current value and increments it by one each second.
 */
export default makeGlobal((ctx) => {
  const $$current = makeState(0);

  ctx.afterConnect(() => {
    setInterval(() => {
      $$current.update((x) => x + 1);
    }, 1000);
  });

  return {
    $current: $$current.readable(),
    reset() {
      $$current.set(0);
    },
  };
});

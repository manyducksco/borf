import { makeGlobal } from "@woofjs/client";

/**
 * Exposes a $current value and increments it by one each second.
 */
export default makeGlobal((ctx) => {
  ctx.defaultState = {
    current: 0,
  };

  ctx.afterConnect(() => {
    setInterval(() => {
      ctx.set("current", (x) => x + 1);
    }, 1000);
  });

  return {
    $current: ctx.readable("current"),
    reset() {
      ctx.set("current", 0);
    },
  };
});

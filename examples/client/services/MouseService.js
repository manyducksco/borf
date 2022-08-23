import { makeService, makeState } from "@woofjs/client";

export default makeService((ctx) => {
  const $position = makeState({ x: 0, y: 0 });

  ctx.afterConnect(() => {
    ctx.debug.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      $position.set({
        x: e.clientX,
        y: e.clientY,
      });
    });
  });

  return {
    $position,
  };
});

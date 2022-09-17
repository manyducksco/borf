import { makeGlobal } from "@woofjs/client";

export default makeGlobal((ctx) => {
  ctx.defaultState = {
    position: { x: 0, y: 0 },
  };

  ctx.afterConnect(() => {
    ctx.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      ctx.set("position", {
        x: e.clientX,
        y: e.clientY,
      });
    });
  });

  return {
    $position: ctx.readable("position"),
  };
});

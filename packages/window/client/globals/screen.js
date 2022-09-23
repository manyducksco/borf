import { makeGlobal } from "@woofjs/client";

export default makeGlobal((ctx) => {
  ctx.defaultState = {
    dragging: false,
  };

  return {
    $dragging: ctx.readable("dragging"),
  };
});

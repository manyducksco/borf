import { makeGlobal, makeState } from "@woofjs/client";

export default makeGlobal((ctx) => {
  const $$dragging = makeState(false);

  return {
    $dragging: $$dragging.readable(),
  };
});

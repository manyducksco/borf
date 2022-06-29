import { makeState } from "@woofjs/client";

export default (self) => {
  const $dragging = makeState(false);

  return {
    $dragging,
  };
};

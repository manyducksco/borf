import { makeState } from "@woofjs/client";

export default function () {
  const $dragging = makeState(false);

  return {
    $dragging,
  };
}

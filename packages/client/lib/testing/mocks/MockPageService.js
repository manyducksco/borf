import { makeState } from "../../state/makeState.js";

export function MockPageService() {
  const $title = makeState("Test");

  return {
    $title,
  };
}

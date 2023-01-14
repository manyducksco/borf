import { makeState } from "../../../helpers/state.js";

export default function mockPage(ctx) {
  return {
    $$title: makeState("Test"),
    $visibility: makeState("visible").readable(),
  };
}

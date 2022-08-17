import { makeComponent } from "../../makeComponent.js";
import { makeState } from "../../state/makeState.js";

export default makeComponent(function mockPageService() {
  const $title = makeState("Test");

  return {
    $title,
  };
});

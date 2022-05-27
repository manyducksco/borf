import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { isString } from "../helpers/typeChecking.js";

export default makeService((self) => {
  self.debug.name = "woof:service:@page";

  const $title = makeState(document?.title);

  self.afterConnect(() => {
    if (document) {
      self.watchState($title, (current) => {
        if (isString(current)) {
          document.title = current;
        }
      });
    }
  });

  return {
    $title,
  };
});

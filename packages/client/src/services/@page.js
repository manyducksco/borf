import { makeState } from "../state/makeState.js";
import { isString } from "../helpers/typeChecking.js";

export default function PageService(self) {
  self.debug.name = "woof:@page";

  const $title = makeState(document?.title);

  self.afterConnect(() => {
    if (document) {
      self.watchState(
        $title,
        (current) => {
          if (isString(current)) {
            document.title = current;
          }
        },
        { immediate: false }
      );
    }
  });

  return {
    $title,
  };
}

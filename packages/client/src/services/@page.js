import { makeState } from "@woofjs/state";
import { isString } from "../helpers/typeChecking";

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

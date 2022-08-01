import { makeState } from "../state/makeState.js";
import { isString } from "../helpers/typeChecking.js";

export default function PageService() {
  this.debug.name = "woof:service:page";

  const $title = makeState(document?.title);

  this.afterConnect(() => {
    if (document) {
      this.watchState(
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

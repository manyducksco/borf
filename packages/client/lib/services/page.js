import { makeState } from "../state/makeState.js";
import { isString } from "../helpers/typeChecking.js";

export function PageService() {
  this.debug.name = "woof:service:page";

  const $title = makeState(document?.title);

  this.afterConnect(() => {
    if (document) {
      this.subscribeTo($title, (current) => {
        if (isString(current)) {
          document.title = current;
        }
      });
    }
  });

  return {
    $title,
  };
}

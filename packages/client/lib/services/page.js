import { makeState } from "../state/makeState.js";
import { isString } from "../helpers/typeChecking.js";
import { makeService } from "../makeService.js";

export default makeService((ctx) => {
  ctx.debug.name = "woof:service:page";

  const $title = makeState(document?.title);

  ctx.afterConnect(() => {
    if (document) {
      ctx.subscribeTo($title, (current) => {
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

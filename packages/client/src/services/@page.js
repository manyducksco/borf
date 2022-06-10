import { makeState } from "@woofjs/state";
import { makeService } from "../makeService";
import { isString } from "../helpers/typeChecking";

export default makeService(({ debug, afterConnect, watchState }) => {
  debug.name = "woof:@page";

  const $title = makeState(document?.title);

  afterConnect(() => {
    if (document) {
      watchState($title, (current) => {
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

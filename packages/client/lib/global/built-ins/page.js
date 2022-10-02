import { isString } from "../../helpers/typeChecking.js";
import { makeGlobal } from "../makeGlobal.js";

export default makeGlobal((ctx) => {
  ctx.defaultState = {
    title: document?.title,
  };

  ctx.afterConnect(() => {
    if (document) {
      ctx.observe("title", (current) => {
        if (isString(current)) {
          document.title = current;
        }
      });
    }
  });

  return {
    $$title: ctx.writable("title"),
  };
});

import { isString } from "../../helpers/typeChecking.js";
import { makeGlobal } from "../makeGlobal.js";

export default makeGlobal((ctx) => {
  const $$title = ctx.state(document?.title);
  const $$visibility = ctx.state(document.visibilityState);

  ctx.afterConnect(() => {
    if (document) {
      ctx.observe($$title, (current) => {
        if (isString(current)) {
          document.title = current;
        }
      });

      document.addEventListener("visibilitychange", () => {
        $$visibility.set(document.visibilityState);
      });

      window.addEventListener("focus", () => {
        $$visibility.set("visible");
      });
    }
  });

  return {
    $$title,
    $visibility: $$visibility.readable(),
  };
});

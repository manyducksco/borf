import { isString } from "../helpers/typeChecking.js";

export function page() {
  this.defaultState = {
    title: document?.title,
  };

  this.afterConnect(() => {
    if (document) {
      this.observe("title", (current) => {
        if (isString(current)) {
          document.title = current;
        }
      });
    }
  });

  return {
    $$title: this.readWrite("title"),
  };
}

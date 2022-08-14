import { State } from "../State.js";
import { isString } from "../helpers/typeChecking.js";
import { Service } from "../Service.js";

export default new Service(function PageService() {
  this.debug.name = "woof:service:page";

  const $title = new State(document?.title);

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
});

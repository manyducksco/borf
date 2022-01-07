import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { isString } from "../../_helpers/typeChecking.js";

/**
 * Top level navigation and page metadata service.
 */
const PageService = makeService((self) => {
  self.debug.label = "woof:@page";

  const $title = makeState(document?.title);
  const history = self.options.history;

  self.connected(() => {
    if (document) {
      $title.watch((value) => {
        document.title = value;
      });
    }
  });

  return {
    $title,

    $route: makeState({
      path: "",
      query: {},
      params: {},
      route: "",
      wildcard: null,
    }),

    back(steps = 1) {
      history.go(-steps);
    },

    forward(steps = 1) {
      history.go(steps);
    },

    /**
     * Navigates to another route.
     *
     * @param to - Path string or number of history entries
     * @param options - `replace: true` to replace state
     */
    go(to, options = {}) {
      if (isString(to)) {
        if (options.replace) {
          history.replace(to);
        } else {
          history.push(to);
        }
      } else {
        throw new TypeError(`Expected a string. Received: ${to}`);
      }
    },
  };
});

export default PageService;

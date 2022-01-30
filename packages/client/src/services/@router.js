import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { isString } from "../helpers/typeChecking.js";

/**
 * Top level navigation service.
 */
export default makeService((self) => {
  self.debug.name = "woof:@router";

  const history = self.options.history;

  return {
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

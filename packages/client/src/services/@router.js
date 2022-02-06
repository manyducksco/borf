import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { isString } from "../helpers/typeChecking.js";
import { resolvePath } from "../helpers/resolvePath.js";

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
     * @param path - Path string
     * @param options - `replace: true` to replace state
     */
    go(path, options = {}) {
      if (isString(path)) {
        path = resolvePath(history.location.pathname, path);

        if (options.replace) {
          history.replace(path);
        } else {
          history.push(path);
        }
      } else {
        throw new TypeError(`Expected a string. Got: ${path}`);
      }
    },
  };
});

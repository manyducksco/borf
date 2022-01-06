import { makeState } from "@woofjs/state";
import { Service } from "../Service";

const ExampleComponent = makeComponent(({}) => {});

const PageService = makeService(({ _created, _connected }) => {
  let history;

  const $title = makeState(document?.title);

  _created((options) => {
    history = options.history;
  });

  _connected(() => {
    if (document) {
      $title.watch((value) => {
        document.title = value;
      });
    }
  });

  return {
    $title,

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

export default class Page extends Service {
  $title = makeState(document?.title);

  $route = makeState({
    path: "",
    query: {},
    params: {},
    route: "",
    wildcard: null,
  });

  #history;

  _created({ history }) {
    this.#history = history;
  }

  _connected() {
    if (document) {
      this.$title.watch((value) => {
        document.title = value;
      });
    }
  }

  back(steps = 1) {
    this.#history.go(-steps);
  }

  forward(steps = 1) {
    this.#history.go(steps);
  }

  /**
   * Navigates to another route.
   *
   * @param to - Path string or number of history entries
   * @param options - `replace: true` to replace state
   */
  go(to, options = {}) {
    if (isString(to)) {
      if (options.replace) {
        this.#history.replace(to);
      } else {
        this.#history.push(to);
      }
    } else {
      throw new TypeError(`Expected a string. Received: ${to}`);
    }
  }
}

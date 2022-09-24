import { isFunction, isTemplate, isView } from "./helpers/typeChecking.js";
import { initView } from "./helpers/initView.js";

export function makeTransitions(options) {
  // Returns a function that wraps an element with these transitions.
  // This function needs to return a Template-compatible object.
  return function (element) {
    const template = {
      init({ appContext, elementContext = {} }) {
        elementContext = {
          ...elementContext,
        };

        let view = element;

        if (isFunction(view)) {
          view = initView(view, { appContext, elementContext });
        }

        if (isTemplate(view)) {
          view = view.init({ appContext, elementContext });
        }

        if (!isView(view)) {
          throw new TypeError(`Transitions can only be applied to a template or view.`);
        }

        const methods = {
          state: view.state,

          get node() {
            return view.node;
          },

          get isConnected() {
            return view.isConnected;
          },

          setChildren(children) {
            view.setChildren(children);
          },

          connect(parent, after = null) {
            if (options.in && !view.isConnected) {
              const ctx = {
                node: view.node,
                get: view.state.get,
                set: view.state.set,
                done: () => {},
              };

              view.connect(parent, after);

              const res = options.in(ctx);
              if (isFunction(res?.then)) {
                res.then(ctx.done);
              }
            } else {
              view.connect(parent, after);
            }
          },

          disconnect() {
            if (options.out) {
              const ctx = {
                node: view.node,
                get: view.state.get,
                set: view.state.set,
                done: () => {
                  view.disconnect();
                },
              };

              const res = options.out(ctx);
              if (isFunction(res?.then)) {
                res.then(ctx.done);
              }
            } else {
              view.disconnect();
            }
          },
        };

        Object.defineProperty(methods, "isView", {
          value: true,
          writable: false,
          enumerable: true,
          configurable: false,
        });

        return methods;
      },
    };

    Object.defineProperty(template, "isTemplate", {
      value: true,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    return template;
  };
}

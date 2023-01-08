import { isReadable, isObject } from "../helpers/typeChecking.js";
import { joinStates } from "../helpers/state.js";

export function makeTransitions(fn) {
  // Function called by view to set up transitions object.
  function create(mapToCSS) {
    let enter = () => Promise.resolve();
    let exit = () => Promise.resolve();

    const exports = fn({
      enter(fn) {
        enter = fn;
      },
      exit(fn) {
        exit = fn;
      },
    });

    if (!isObject(exports)) {
      throw new TypeError(`Transition functions must return an object. Got: ${exports}`);
    }

    return {
      exports,
      async enter(node) {
        let sub;

        if (node?.style && mapToCSS) {
          sub = observeExports(exports, (current) => {
            requestAnimationFrame(() => {
              const mapped = mapFn(current);
              for (const key in mapped) {
                node.style[key] = mapped[key];
              }
            });
          });
        }

        await enter();

        if (sub) {
          sub.unsubscribe();
        }
      },
      async exit(node) {
        let sub;

        if (node?.style && mapToCSS) {
          sub = observeExports(exports, (current) => {
            requestAnimationFrame(() => {
              const mapped = mapFn(current);
              for (const key in mapped) {
                node.style[key] = mapped[key];
              }
            });
          });
        }

        await exit();

        if (sub) {
          sub.unsubscribe();
        }
      },
    };
  }

  Object.defineProperties(create, {
    isTransitions: {
      value: true,
    },
  });

  return create;
}

/**
 * Observes values in an object that can contain both static and readable values.
 */
function observeExports(exports, observerFn) {
  const entries = Object.entries(exports);
  const readables = {};
  const statics = {};

  for (const [key, value] of entries) {
    if (isReadable(value)) {
      readables[key] = value;
    }

    statics[key] = value;
  }

  const $combined = joinStates(Object.values(readables), (...current) => {
    const keys = Object.keys();
    const values = current.reduce((obj, value, i) => {
      obj[keys[i]] = value;
      return obj;
    }, {});

    return {
      ...statics,
      ...values,
    };
  });

  return $combined.subscribe(observerFn);
}

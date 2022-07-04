import ColorHash from "color-hash";

/**
 * Creates a factory for channels; prefixed console objects that only
 * print when the debug filter matches that channel's name.
 *
 * Useful for logging info that you want to hide in production without
 * deleting all your `console.log`s. Just change the filter to specify
 * only what you want to see.
 *
 * @param options - Options for the debug instance. Specify an initial `filter` and enable or disable `log`, `warn` or `error` with booleans.
 */
export function makeDebug(options = {}, console = global.console) {
  let filter = options.filter || "*,-woof:*";
  let matchFn = makeMatchFn(filter);

  const hash = new ColorHash({
    lightness: [0.6, 0.7],
    saturation: [0.6, 0.7],
  });

  return {
    get filter() {
      return filter;
    },

    set filter(value) {
      filter = value;
      matchFn = makeMatchFn(value);
    },

    makeChannel(name) {
      if (name.includes(",")) {
        throw new Error(`Channel names cannot contain commas. Got: ${name}`);
      }

      return {
        get name() {
          return name;
        },

        set name(value) {
          if (value.includes(",")) {
            throw new Error(`Channel names cannot contain commas. Got: ${value}`);
          }
          name = value;
        },

        get log() {
          if (options.log === false || !matchFn(name)) {
            return () => {};
          }

          return console.log.bind(window.console, `%c[${name}]`, `color:${hash.hex(name)};font-weight:bold`);
        },

        get warn() {
          if (options.warn === false || !matchFn(name)) {
            return () => {};
          }

          return console.warn.bind(window.console, `%c[${name}]`, `color:${hash.hex(name)};font-weight:bold`);
        },

        get error() {
          if (options.error === false || !matchFn(name)) {
            return () => {};
          }

          return console.error.bind(window.console, `%c[${name}]`, `color:${hash.hex(name)};font-weight:bold`);
        },
      };
    },
  };
}

/**
 * Parses a filter string into a match function.
 *
 * @param filter - A string or regular expression that specifies a pattern for names of debug channels you want to display.
 */
export function makeMatchFn(filter) {
  if (filter instanceof RegExp) {
    return (value) => filter.test(value);
  }

  const matchers = {
    positive: [],
    negative: [],
  };

  const parts = filter
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");

  for (let part of parts) {
    let section = "positive";

    if (part.startsWith("-")) {
      section = "negative";
      part = part.slice(1);
    }

    if (part === "*") {
      matchers[section].push(function (value) {
        return true;
      });
    } else if (part.endsWith("*")) {
      matchers[section].push(function (value) {
        return value.startsWith(part.slice(0, part.length - 1));
      });
    } else {
      matchers[section].push(function (value) {
        return value === part;
      });
    }
  }

  return function (name) {
    const { positive, negative } = matchers;

    // Matching any negative matcher disqualifies.
    if (negative.some((fn) => fn(name))) {
      return false;
    }

    // Matching at least one positive matcher is required if any are specified.
    if (positive.length > 0 && !positive.some((fn) => fn(name))) {
      return false;
    }

    return true;
  };
}

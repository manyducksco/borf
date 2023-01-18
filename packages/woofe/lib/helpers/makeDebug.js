import colorHash from "simple-color-hash";

const noop = () => {};

export function makeDebug(options = {}, _console = window?.console || global?.console) {
  let filter = options.filter || "*,-woofe:*";
  let matchFn = makeMatch(filter);

  return {
    get filter() {
      return filter;
    },

    set filter(value) {
      filter = value;
      matchFn = makeMatch(filter);
    },

    makeChannel: (name) => {
      assertNameFormat(name);

      return {
        get name() {
          return name;
        },

        set name(value) {
          assertNameFormat(value);
          name = value;
        },

        get log() {
          if (options.log === false || !matchFn(name)) return noop;

          return _console.log.bind(_console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
        },

        get warn() {
          if (options.warn === false || !matchFn(name)) return noop;

          return _console.warn.bind(_console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
        },

        get error() {
          if (options.error === false || !matchFn(name)) return noop;

          return _console.error.bind(_console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
        },
      };
    },
  };
}

function hash(value) {
  return colorHash({
    str: value,
    sat: { min: 0.35, max: 0.55 },
    light: { min: 0.6, max: 0.6 },
  });
}

function assertNameFormat(name) {
  if (name.includes(",")) {
    throw new Error(`Channel names cannot contain commas. Got: ${name}`);
  }
}

/**
 * Parses a filter string into a match function.
 *
 * @param filter - A string or regular expression that specifies a pattern for names of debug channels you want to display.
 */
export function makeMatch(filter) {
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
      matchers[section].push(function () {
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

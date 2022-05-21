import { makeState } from "@woofjs/state";
import ColorHash from "color-hash";

export function makeDebug(options = {}) {
  const $filter = makeState(options.filter || "*,-woof:*");

  const hash = new ColorHash({
    lightness: [0.6, 0.7],
    saturation: [0.6, 0.7],
  });

  let matchFn = () => true;

  // Update match function based on how the filter is set
  $filter.watch(
    (current) => {
      matchFn = parseFilter(current);
    },
    { immediate: true }
  );

  return {
    $filter,

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

function parseFilter(filter) {
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

  for (const part of parts) {
    const section = part.startsWith("-") ? "negative" : "positive";

    if (part === "*") {
      matchers[section].push(function (value) {
        return true;
      });
    } else if (part.endsWith("*")) {
      matchers[section].push(function (value) {
        return value.startsWith(part.slice(1, part.length - 1));
      });
    } else {
      matchers[section].push(function (value) {
        return value === part.slice(1, part.length - 1);
      });
    }
  }

  return (value) => matchFilter(matchers, value);
}

function matchFilter(matchers, name) {
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
}

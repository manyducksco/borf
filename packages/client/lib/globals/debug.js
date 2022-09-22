import colorHash from "simple-color-hash";
import { APP_CONTEXT } from "../keys.js";
import { makeGlobal } from "../makers/makeGlobal.js";

const noop = () => {};

export default makeGlobal((ctx) => {
  const options = ctx[APP_CONTEXT].options.debug || {};
  const console = options._console || window?.console || global?.console;

  ctx.defaultState = {
    filter: options.filter || "*,-woof:*",
  };

  let match;
  ctx.observe("filter", (filter) => {
    match = makeMatch(filter);
  });

  return {
    $$filter: ctx.writable("filter"),

    channel: (name) => {
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
          if (options.log === false || !match(name)) return noop;

          return console.log.bind(console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
        },

        get warn() {
          if (options.warn === false || !match(name)) return noop;

          return console.warn.bind(console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
        },

        get error() {
          if (options.error === false || !match(name)) return noop;

          return console.error.bind(console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
        },
      };
    },
  };
});

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

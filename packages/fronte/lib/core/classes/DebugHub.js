import colorHash from "simple-color-hash";

/**
 * The central trunk from which all channels branch.
 * Changing the filter here determines what kind of messages are printed across the app.
 */
export class DebugHub {
  #filter;
  #matcher;
  #console;
  #options;

  constructor(options = {}, _console = window?.console || global?.console) {
    // Using the setter to generate an initial matcher.
    this.filter = options.filter || "*,-fronte:*";
    this.#console = _console;
    this.#options = options;
  }

  channel(name) {
    assertNameFormat(name);

    const _console = this.#console;
    const options = this.#options;

    const match = (value) => {
      return this.#matcher(value);
    };

    return {
      get log() {
        if (options.log === false || !match(name)) return noOp;
        else return _console.log.bind(_console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
      },

      get warn() {
        if (options.warn === false || !match(name)) return noOp;
        else return _console.warn.bind(_console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
      },

      get error() {
        if (options.error === false || !match(name)) return noOp;
        else return _console.error.bind(_console, `%c[${name}]`, `color:${hash(name)};font-weight:bold`);
      },
    };
  }

  get filter() {
    return this.#filter;
  }

  set filter(pattern) {
    this.#filter = pattern;
    this.#matcher = makeMatcher(pattern);
  }
}

/* ----- Helpers ----- */

const noOp = () => {};

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
 * @param pattern - A string or regular expression that specifies a pattern for names of debug channels you want to display.
 */
export function makeMatcher(pattern) {
  if (pattern instanceof RegExp) {
    return (value) => pattern.test(value);
  }

  const matchers = {
    positive: [],
    negative: [],
  };

  const parts = pattern
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

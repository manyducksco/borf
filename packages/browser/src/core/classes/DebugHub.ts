import type { CrashCollector } from "./CrashCollector.js";

import colorHash from "simple-color-hash";

export type DebugOptions = {
  /**
   * Determines which debug channels are printed. Supports multiple filters with commas,
   * a prepended `-` to exclude a channel and wildcards to match partial channels.
   *
   * @example "store:*,-store:test" // matches everything starting with "store" except "store:test"
   */
  filter?: string | RegExp;

  /**
   * Print log messages when true. Default: true for development builds, false for production builds.
   */
  log?: boolean | "development";

  /**
   * Print warn messages when true. Default: true for development builds, false for production builds.
   */
  warn?: boolean | "development";

  /**
   * Print error messages when true. Default: true.
   */
  error?: boolean | "development";
};

/**
 * The central trunk from which all channels branch.
 * Changing the filter here determines what kind of messages are printed across the app.
 */
export class DebugHub {
  #filter: string | RegExp = "*,-borf:*";
  #matcher;
  #console;
  #options;

  constructor(
    options: DebugOptions & { crashCollector: CrashCollector },
    _console = window?.console || global?.console
  ) {
    if (options.filter) {
      this.#filter = options.filter;
    }

    this.#matcher = makeMatcher(this.#filter);
    this.#console = _console;
    this.#options = options;
  }

  channel(name: string) {
    assertNameFormat(name);

    const _console = this.#console;
    const options = this.#options;

    const match = (value: string) => {
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

function hash(value: string) {
  return colorHash({
    str: value,
    sat: { min: 0.35, max: 0.55 },
    light: { min: 0.6, max: 0.6 },
  });
}

function assertNameFormat(name: string) {
  if (name.includes(",")) {
    throw new Error(`Channel names cannot contain commas. Got: ${name}`);
  }
}

type MatcherFunction = (value: string) => boolean;

/**
 * Parses a filter string into a match function.
 *
 * @param pattern - A string or regular expression that specifies a pattern for names of debug channels you want to display.
 */
export function makeMatcher(pattern: string | RegExp) {
  if (pattern instanceof RegExp) {
    return (value: string) => pattern.test(value);
  }

  const matchers: Record<"positive" | "negative", MatcherFunction[]> = {
    positive: [],
    negative: [],
  };

  const parts = pattern
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");

  for (let part of parts) {
    let section: "positive" | "negative" = "positive";

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

  return function (name: string) {
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

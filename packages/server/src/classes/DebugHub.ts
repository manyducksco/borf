export interface DebugChannel {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface DebugOptions {
  filter?: string | RegExp;
  log?: boolean | "development";
  warn?: boolean | "development";
  error?: boolean | "development";
}

export class DebugHub {
  #filter: string | RegExp = "*,-borf:*";
  #matcher;
  #console;
  #options;

  constructor(options: DebugOptions = {}, _console = console) {
    this.#filter = options.filter ?? this.#filter;
    this.#matcher = makeMatcher(this.#filter);
    this.#console = _console;
    this.#options = options;
  }

  channel(name: string): DebugChannel {
    assertNameFormat(name);

    const _console = this.#console;
    const options = this.#options;
    const match = this.#matcher;

    return {
      get log() {
        if (options.log === false || !match(name)) return noOp;
        else return _console.log.bind(_console, `${timestamp()} (${name})`);
      },

      get warn() {
        if (options.warn === false || !match(name)) return noOp;
        else return _console.warn.bind(_console, `${timestamp()} (${name})`);
      },

      get error() {
        if (options.error === false || !match(name)) return noOp;
        else return _console.error.bind(_console, `${timestamp()} (${name})`);
      },
    };
  }

  get filter() {
    return this.#filter;
  }

  set filter(pattern: string | RegExp) {
    this.#filter = pattern;
    this.#matcher = makeMatcher(pattern);
  }
}

function noOp() {}

function timestamp() {
  return new Date().toISOString();
}

function assertNameFormat(name: string) {
  if (name.includes(",")) {
    throw new Error(`Channel names cannot contain commas. Got: ${name}`);
  }
}

/**
 * Parses a filter string into a match function.
 *
 * @param pattern - A string or regular expression that specifies a pattern for names of debug channels you want to display.
 */
export function makeMatcher(pattern: string | RegExp) {
  if (pattern instanceof RegExp) {
    return (value: string) => pattern.test(value);
  }

  type MatcherType = "positive" | "negative";

  const matchers: Record<MatcherType, ((value: string) => boolean)[]> = {
    positive: [],
    negative: [],
  };

  const parts = pattern
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");

  for (let part of parts) {
    let section: MatcherType = "positive";

    if (part.startsWith("-")) {
      section = "negative";
      part = part.slice(1);
    }

    if (part === "*") {
      matchers[section].push(function () {
        return true;
      });
    } else if (part.endsWith("*")) {
      matchers[section].push(function (value: string) {
        return value.startsWith(part.slice(0, part.length - 1));
      });
    } else {
      matchers[section].push(function (value: string) {
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

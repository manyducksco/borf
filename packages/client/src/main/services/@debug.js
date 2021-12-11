import { Service } from "../Service.js";

/**
 * Debug logging service used internally and exposed for use in apps.
 */
export default class Debug extends Service {
  #filter = "*,-woof:*";
  #matchers = {
    positive: [],
    negative: [],
  };
  #transports = [new ConsoleTransport()];

  _created(options = {}) {
    this.setFilter(options.filter || this.#filter);
  }

  /**
   * Sets the filter string.
   *
   * @example
   * .setFilter("*,-woof:*")
   * .setFilter("*")
   * .setFilter("woof:http,messages,-auth:*")
   *
   * @param filter - Comma separated list of names. Ones starting in - will hide channels with matching names.
   */
  setFilter(filter) {
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

    this.#filter = filter;
    this.#matchers = matchers;
  }

  /**
   * Creates a new logger channel prefixed with a name.
   */
  channel(name) {
    if (name.includes(",")) {
      throw new Error(`Channel names cannot contain commas. Received: ${name}`);
    }

    return {
      log: (...args) => {
        if (this.#matchFilter(name)) {
          for (const transport of this.#transports) {
            transport.receive(name, ...args);
          }
        }
      },
    };
  }

  #matchFilter(name) {
    const { positive, negative } = this.#matchers;

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
}

class ConsoleTransport {
  receive(name, ...args) {
    console.log(`%c${name}`, "color: orange; font-weight: bold;", ...args);
  }
}

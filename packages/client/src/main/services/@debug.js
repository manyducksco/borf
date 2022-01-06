import { makeState } from "@woofjs/state";
import ColorHash from "color-hash";
import { Service } from "../Service.js";

/**
 * Debug logging service used internally and exposed for use in apps.
 */
export default class Debug extends Service {
  filter = makeState();

  #matchers = {
    positive: [],
    negative: [],
  };
  #transports = [new ConsoleTransport()];

  /**
   * Creates a new logger channel prefixed with a name.
   */
  channel(name) {
    if (name.includes(",")) {
      throw new Error(`Channel names cannot contain commas. Received: ${name}`);
    }

    return {
      log: (...args) => {
        if (this.#matchFilter(this.#matchers, name)) {
          for (const transport of this.#transports) {
            transport.receive(name, ...args);
          }
        }
      },
    };
  }

  _created(options = {}) {
    this.filter.watch((value) => {
      this.#matchers = this.#parseFilter(value);
    });

    this.filter.set(options.filter || "*,-woof:*");
  }

  #parseFilter(filter) {
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

    return matchers;
  }

  #matchFilter(matchers, name) {
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
}

class ConsoleTransport {
  hash = new ColorHash({
    lightness: [0.6, 0.7],
    saturation: [0.6, 0.7],
  });

  receive(name, ...args) {
    console.log(`%c[${name}]`, `color:${this.hash.hex(name)};font-weight:bold`, ...args);
  }
}

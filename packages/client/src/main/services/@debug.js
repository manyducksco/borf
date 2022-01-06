import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import ColorHash from "color-hash";

/**
 * Debug logging service used internally and exposed for use in apps.
 */
const DebugService = makeService((self) => {
  self.debug.label = "woof:@debug";

  const $filter = makeState();

  let matchers = {
    positive: [],
    negative: [],
  };
  let transports = [new ConsoleTransport()];

  self.watchState($filter, (current) => {
    matchers = parseFilter(current);
  });

  self.created((options) => {
    $filter.set(options.filter || "*,-woof:*");
  });

  return {
    $filter,

    channel(name) {
      if (name.includes(",")) {
        throw new Error(`Channel names cannot contain commas. Received: ${name}`);
      }

      return {
        log: (...args) => {
          if (matchFilter(matchers, name)) {
            for (const transport of transports) {
              transport.receive(name, "log", ...args);
            }
          }
        },
        warn: (...args) => {
          if (matchFilter(matchers, name)) {
            for (const transport of transports) {
              transport.receive(name, "warn", ...args);
            }
          }
        },
        error: (...args) => {
          if (matchFilter(matchers, name)) {
            for (const transport of transports) {
              transport.receive(name, "error", ...args);
            }
          }
        },
      };
    },
  };
});

export default DebugService;

function parseFilter(filter) {
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

class ConsoleTransport {
  hash = new ColorHash({
    lightness: [0.6, 0.7],
    saturation: [0.6, 0.7],
  });

  receive(name, level, ...args) {
    if (level === "error") {
      console.error(`%c[${name}]`, `color:${this.hash.hex(name)};font-weight:bold`, ...args);
    } else if (level === "warn") {
      console.warn(`%c[${name}]`, `color:${this.hash.hex(name)};font-weight:bold`, ...args);
    } else {
      console.log(`%c[${name}]`, `color:${this.hash.hex(name)};font-weight:bold`, ...args);
    }
  }
}

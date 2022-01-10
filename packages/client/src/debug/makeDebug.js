import { makeState } from "@woofjs/state";
import { makeConsoleReceiver } from "./debug.console.js";

export function makeDebug(options = {}) {
  const $filter = makeState(options.filter || "*,-woof:*");

  let match = () => true;
  let receivers = [makeConsoleReceiver()];

  // Update match function based on how the filter is set.
  $filter.watch(
    (current) => {
      match = parseFilter(current);
    },
    { immediate: true }
  );

  return {
    $filter,

    makeChannel(name) {
      if (name.includes(",")) {
        throw new Error(`Channel names cannot contain commas. Got: ${name}`);
      }

      return Object.freeze({
        get name() {
          return name;
        },
        set name(value) {
          if (value.includes(",")) {
            throw new Error(`Channel names cannot contain commas. Got: ${value}`);
          }
          name = value;
        },

        log(...args) {
          if (options.log && match(name)) {
            for (const receiver of receivers) {
              receiver.receive(name, "log", ...args);
            }
          }
        },
        warn(...args) {
          if (options.warn && match(name)) {
            for (const receiver of receivers) {
              receiver.receive(name, "warn", ...args);
            }
          }
        },
        error(...args) {
          if (options.error && match(name)) {
            for (const receiver of receivers) {
              receiver.receive(name, "error", ...args);
            }
          }
        },
      });
    },

    addReceiver(receiver) {
      receivers.push(receiver);
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

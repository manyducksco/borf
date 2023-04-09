import { HTTPClient } from "@borf/bedrock";
import { Store } from "../classes/Store.js";

// TODO: Types are not being inferred because of how `define` is written.
export const HTTPStore = new Store({
  label: "http",
  about: "A nice HTTP client that auto-parses responses and supports middleware.",
  inputs: {
    fetch: {
      about: "The fetch function to use for requests. Pass this to mock for testing.",
      default: getDefaultFetch(),
    },
  },

  setup(ctx) {
    const { fetch } = ctx.inputs.get();
    return new HTTPClient({ fetch });
  },
});

function getDefaultFetch() {
  if (typeof window !== "undefined" && window.fetch) {
    return window.fetch.bind(window);
  }

  if (typeof global !== "undefined" && global.fetch) {
    return global.fetch.bind(global);
  }
}

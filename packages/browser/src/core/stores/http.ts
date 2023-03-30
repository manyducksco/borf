import { HTTPClient } from "@borf/bedrock";
import { Store } from "../classes/Store.js";

// TODO: Types are not being inferred because of how `define` is written.
export const HTTPStore = Store.define({
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
  if (window?.fetch) {
    return window.fetch.bind(window);
  }

  if (global?.fetch) {
    return global.fetch.bind(window);
  }
}

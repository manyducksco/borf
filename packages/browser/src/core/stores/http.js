import { HTTPClient } from "@borf/bedrock";
import { Store } from "../classes/Store.js";

export const HTTPStore = Store.define({
  label: "http",
  about: "A nice HTTP client that auto-parses responses and supports middleware.",
  inputs: {
    fetch: {
      about: "The fetch function to use for requests. Pass this to mock for testing.",
      type: "function",
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

import { HTTPClient } from "@borf/bedrock";
import { ComponentCore } from "../scratch.js";

interface HTTPStoreInputs {
  /**
   * The fetch function to use for requests. Pass this to mock for testing.
   */
  fetch?: typeof window.fetch;
}

export function HTTPStore(self: ComponentCore<HTTPStoreInputs>) {
  self.setName("borf:http");

  let fetch = self.inputs.get("fetch");

  if (!fetch && typeof window !== "undefined" && window.fetch) {
    fetch = window.fetch.bind(window);
  }

  if (!fetch && typeof global !== "undefined" && global.fetch) {
    fetch = global.fetch.bind(global);
  }

  return new HTTPClient({ fetch });
}

import z from "zod";
import { Store } from "@borf/browser";

const Test = Store.define({
  inputs: {
    numberArray: {
      schema: z.array(z.number()),
    },
    callback: {
      schema: z.function(),
    },
    optionalCallback: {
      schema: z.function().optional(), // TODO: Only optional function is being inferred correctly. Non-optional gets 'any'.
    },
  },

  setup: (ctx) => {
    return {};
  },
});

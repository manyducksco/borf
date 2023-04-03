import { Store } from "../../Store.js";

export const DialogStore = Store.define({
  label: "dialog",
  setup: (ctx) => {
    return {
      open() {
        ctx.warn("Not yet implemented for web components.");
      },
    };
  },
});

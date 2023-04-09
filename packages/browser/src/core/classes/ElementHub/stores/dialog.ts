import { Store } from "../../Store.js";

export const DialogStore = new Store({
  label: "dialog",
  setup: (ctx) => {
    return {
      open() {
        ctx.warn("Not yet implemented for web components.");
      },
    };
  },
});

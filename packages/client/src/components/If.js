import { makeComponent } from "../makeComponent.js";
import { Watch } from "./Watch.js";

export const If = makeComponent(($, self) => {
  return $(Watch, {
    value: self.$attrs.map("value"),
    makeItem: (value) => {
      if (value) {
        return self.$attrs.get("then");
      } else {
        return self.$attrs.get("otherwise");
      }
    },
  });
});

import { makeComponent } from "../../makeComponent.js";
import { Watch } from "./Watch.js";

export const If = makeComponent(($, self) => {
  return $(Watch, {
    value: self.map("value"),
    makeItem: (value) => {
      if (value) {
        return self.get("then");
      } else {
        return self.get("otherwise");
      }
    },
  });
});

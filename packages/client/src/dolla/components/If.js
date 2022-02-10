import { makeComponent } from "../../makeComponent.js";
import { Watch } from "./Watch.js";

export const If = makeComponent(($, self) => {
  const { $attrs } = self;

  return $(Watch, {
    value: $attrs.get("value"),
    makeItem: (value) => {
      if (value) {
        return $attrs.get("then");
      } else {
        return $attrs.get("otherwise");
      }
    },
  });
});

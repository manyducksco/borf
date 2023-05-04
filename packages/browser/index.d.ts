export * from "./src/index";

import type { Ref, Readable } from "./src/index";
import type { IntrinsicElements as Elements } from "./src/core/types";
import type * as CSS from "csstype";

interface ToStringable {
  toString(): string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends Elements {
      // Catch all for custom elements
      [tag: string]: any;
    }
  }
}

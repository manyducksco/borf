import { makeWatch } from "./makeWatch.js";

export function makeIf($state, then, otherwise) {
  return makeWatch($state, (value) => {
    if (value) {
      return then;
    } else {
      return otherwise;
    }
  });
}

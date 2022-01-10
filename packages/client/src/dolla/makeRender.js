import { isState } from "@woofjs/state";
import { isString, isNumber, isFunction, isNode, isDolla } from "../helpers/typeChecking.js";
import { $Text } from "./$Text.js";

/**
 * Takes any element valid as a child and returns a render function that produces a $Node.
 */
export function makeRender(element) {
  if (isNode(element)) {
    return () => element;
  } else if (isDolla(element)) {
    return () => element();
  } else if (isString(element) || isNumber(element)) {
    return () => new $Text(element);
  } else if (isState(element)) {
    return makeRender(element.get());
  } else if (isFunction(element)) {
    return makeRender(element());
  } else {
    console.warn(element);
    throw new Error(`Expected a string, function or element. Received: ${element}`);
  }
}

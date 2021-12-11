import {
  isString,
  isNumber,
  isFunction,
  isNode,
  isDolla,
} from "../../_helpers/typeChecking";
import { $Text } from "./$Text";

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
  } else if (isFunction(element)) {
    return makeRender(element());
  } else {
    throw new Error(
      `Expected a string, function or $(element). Received: ${element}`
    );
  }
}

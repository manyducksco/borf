import { isString, isNumber, isFunction } from "../_helpers/typeChecking";
import { $Text } from "./$Text";

/**
 * Normalizes many types of children and renderables by returning
 * a render function that returns a $Node.
 */
export function makeRender(element) {
  if (element.isNode) {
    return () => element;
  } else if (element.isDolla) {
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

import { Subscription } from "../types";
import { isString, isSubscription } from "../utils";
import { BaseComponent } from "./BaseComponent";

interface Stringifyable {
  toString(): string;
}

/**
 * Displays text content.
 *
 * @param value - text value or subscription to a text value
 */
export const text = (value: Stringifyable | Subscription<Stringifyable>) => {
  if (isString(value)) {
    return new BaseComponent(document.createTextNode(value));
  }

  if (isSubscription<Stringifyable>(value)) {
    const node = document.createTextNode(value.initialValue.toString());

    value.receiver.callback = (newValue) => {
      node.textContent = newValue.toString();
    };

    return new BaseComponent(node);
  }

  throw new Error(
    `Value should be a string or Subscription<string> but received ${typeof value}`
  );
};

import { Subscription } from "../State/types";
import { isString, isSubscription } from "../utils";
import { BaseComponent } from "./BaseComponent";

/**
 * Displays text content.
 *
 * @param value - text value or subscription to a text value
 */
export const text = (value: string | Subscription<string>) => {
  if (isString(value)) {
    return new BaseComponent(document.createTextNode(value));
  }

  if (isSubscription<string>(value)) {
    const node = document.createTextNode(value.current);

    value.receiver.callback = (newValue) => {
      node.textContent = newValue;
    };

    return new BaseComponent(node);
  }

  throw new Error(
    `Value should be a string or Subscription<string> but received ${typeof value}`
  );
};

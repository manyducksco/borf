import { Subscribable } from "../types";
import { isString, isSubscribable } from "../utils";
import { Component } from "./BaseComponent";

interface Stringifyable {
  toString(): string;
}

/**
 * Displays text content.
 *
 * @param value - text value or subscription to a text value
 * @param defaultValue - optional value to display when value is an empty string
 */
export const $text = (
  value: Stringifyable | Subscribable<Stringifyable>,
  defaultValue?: Stringifyable
) => new TextComponent(value, defaultValue);

class TextComponent implements Component {
  root = document.createTextNode("");

  get isMounted() {
    return this.root.parentNode != null;
  }

  constructor(
    value: Stringifyable | Subscribable<Stringifyable>,
    defaultValue?: Stringifyable
  ) {
    if (isString(value)) {
      this.root.textContent = value;
    } else if (isSubscribable<Stringifyable>(value)) {
      const { initialValue, receiver } = value.subscribe();

      receiver.callback = (newValue) => {
        if (newValue || defaultValue == null) {
          this.root.textContent = newValue.toString();
        } else {
          this.root.textContent = defaultValue.toString();
        }
      };

      receiver.callback(initialValue);
    }
  }

  mount(parent: Node, after?: Node) {
    parent.insertBefore(this.root, after ? after.nextSibling : null);
  }

  unmount() {
    if (this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }
}

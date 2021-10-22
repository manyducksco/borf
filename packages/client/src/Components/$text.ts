import { Stringifyable, Subscribable, Subscription } from "../types";
import { isString, isSubscribable } from "../utils";
import { Component } from "./Component";

interface toStringable {
  toString: () => string;
}

/**
 * Displays text content.
 *
 * @param value - text value or subscription to a text value
 * @param defaultValue - optional value to display when value is an empty string
 */
export const $text = (
  source: toStringable | Subscribable<toStringable>,
  defaultValue?: toStringable
) => new TextComponent(source, defaultValue);

export class TextComponent extends Component {
  declare root: Text;
  protected subscription?: Subscription<toStringable>;
  protected source?: Subscribable<toStringable>;
  private isStatic: boolean;

  constructor(
    source: toStringable | Subscribable<toStringable>,
    protected fallbackText?: toStringable
  ) {
    const isStatic = !isSubscribable<toStringable>(source);
    const initialValue = isStatic ? source.toString() : "";

    super(document.createTextNode(initialValue));

    this.isStatic = isStatic;

    if (!isStatic) {
      this.source = source;
    }
  }

  beforeConnect() {
    if (this.isStatic) {
      return;
    }

    if (!this.subscription) {
      this.subscription = this.source!.subscribe();

      this.subscription.receiver.callback = (value) => {
        if (value || this.fallbackText == null) {
          this.root.textContent = value.toString();
        } else {
          this.root.textContent = this.fallbackText.toString();
        }
      };

      this.subscription.receiver.callback(this.subscription.initialValue);
    }
  }

  disconnected() {
    if (this.subscription) {
      this.subscription.receiver.cancel();
      this.subscription = undefined;
    }
  }
}

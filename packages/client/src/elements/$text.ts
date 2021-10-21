import { Stringifyable, Subscribable, Subscription } from "../types";
import { isString } from "../utils";
import { Component } from "./Component";

/**
 * Displays text content.
 *
 * @param value - text value or subscription to a text value
 * @param defaultValue - optional value to display when value is an empty string
 */
export const $text = (
  source: string | Subscribable<Stringifyable>,
  defaultValue?: Stringifyable
) => new TextComponent(source, defaultValue);

export class TextComponent extends Component {
  declare root: Text;
  protected subscription?: Subscription<Stringifyable>;
  protected source?: Subscribable<Stringifyable>;
  private isStatic: boolean;

  constructor(
    source: string | Subscribable<Stringifyable>,
    protected fallbackText?: Stringifyable
  ) {
    const isStatic = isString(source);
    const initialValue = isStatic ? source : "";

    super(document.createTextNode(initialValue));

    this.isStatic = false;
  }

  beforeConnect() {
    if (!this.isStatic && !this.subscription) {
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

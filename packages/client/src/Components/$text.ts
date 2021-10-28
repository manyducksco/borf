import { Listenable } from "../Source/types";
import { isListenable } from "../utils";
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
  source: toStringable | Listenable<toStringable>,
  defaultValue?: toStringable
) => new TextComponent(source, defaultValue);

export class TextComponent extends Component {
  declare element: Text;
  private source?: Listenable<toStringable>;
  private cancel?: () => void;
  private initialValue: string;

  constructor(
    source: toStringable | Listenable<toStringable>,
    protected fallbackText?: toStringable
  ) {
    super();

    const isStatic = !isListenable<toStringable>(source);

    if (isStatic) {
      this.initialValue = source.toString();
    } else {
      this.initialValue = source.current.toString();
      this.source = source;
    }
  }

  createElement() {
    return document.createTextNode(this.initialValue);
  }

  beforeConnect() {
    if (!this.source) {
      return;
    }

    if (!this.cancel) {
      const callback = (value: toStringable) => {
        if (value || this.fallbackText == null) {
          this.element.textContent = value.toString();
        } else {
          this.element.textContent = this.fallbackText.toString();
        }
      };

      this.cancel = this.source.listen(callback);

      callback(this.source.current);
    }
  }

  disconnected() {
    if (this.cancel) {
      this.cancel();
      this.cancel = undefined;
    }
  }
}

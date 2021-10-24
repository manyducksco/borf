import { Listenable } from "../Source";
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
  declare root: Text;
  private source?: Listenable<toStringable>;
  private cancel?: () => void;

  constructor(
    source: toStringable | Listenable<toStringable>,
    protected fallbackText?: toStringable
  ) {
    const isStatic = !isListenable<toStringable>(source);
    const initialValue = isStatic ? source.toString() : "";

    super(document.createTextNode(initialValue));

    if (!isStatic) {
      this.source = source;
    }
  }

  beforeConnect() {
    if (!this.source) {
      return;
    }

    if (!this.cancel) {
      const callback = (value: toStringable) => {
        if (value || this.fallbackText == null) {
          this.root.textContent = value.toString();
        } else {
          this.root.textContent = this.fallbackText.toString();
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

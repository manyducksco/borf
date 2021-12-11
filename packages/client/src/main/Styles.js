/**
 * Creates a stylesheet object with class names as properties.
 * Styles are scoped with a random ID and appended to the document <head>.
 *
 * @example
 * const styles = new Styles({
 *   button: {
 *     color: "yellow",
 *     backgroundColor: "red",
 *     border: "4px dashed magenta"
 *   }
 * });
 *
 * $("button")({
 *   class: styles.button,
 *   onclick: () => {
 *     alert("Greetings from the world's ugliest button")
 *   }
 * })
 */
export class Styles {
  id = Math.ceil(Math.random() * 99999999999999).toString(16);
  styles;

  constructor(styles) {
    this.styles = styles;

    for (const className in styles) {
      this[className] = `${className}_${this.id}`;
    }

    this.#append();
  }

  toString() {
    let output = "";

    for (const className in this.styles) {
      const rules = this.styles[className];

      output += `.${className}_${this.id} {\n`;
      for (const property in rules) {
        // convert name to dash case
        const name = property.replace(
          /[a-z]([A-Z])/,
          (sub, char, index, value) => {
            return value[index] + "-" + char.toLowerCase();
          }
        );

        let value = "";

        if (typeof rules[property] === "number") {
          value = rules[property] + "px";
        } else {
          value = rules[property].toString();
        }

        output += `  ${name}: ${value};\n`;
      }
      output += `}\n\n`;
    }

    return output;
  }

  #append() {
    const root = document.createElement("style");
    root.appendChild(document.createTextNode(this.toString()));
    document.head.appendChild(root);
  }
}

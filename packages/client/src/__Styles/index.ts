interface StyleData {
  [className: string]: {
    [property: string]: any;
  };
}

export class Styles {
  id = Math.ceil(Math.random() * 99999999999999).toString(16);

  constructor(private styles: StyleData) {
    this.mount();
  }

  private mount() {
    const root = document.createElement("style");
    root.appendChild(document.createTextNode(this.toString()));
    document.head.appendChild(root);
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
}

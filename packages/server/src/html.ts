import { Type } from "@borf/bedrock";

interface HTMLTemplate {
  render(): Promise<string>;
}

export function isHTML(value: unknown): value is HTMLTemplate {
  return Type.isObject(value) && Type.isFunction(value.render);
}

/**
 * Renders HTML from a tagged template literal.
 *
 * @example
 * html`
 *   <h1>${title}</h1>
 *   <p>${FancyText("this text is fancy")}</p>
 * `
 *
 * function FancyText(text) {
 *   return html`<span class="fancy">${text}</span>`
 * }
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return {
    async render() {
      let rendered = "";

      for (const str of strings) {
        rendered += str;
        let nextValue = values.shift();

        if (nextValue) {
          if (Type.isPromise(nextValue)) {
            nextValue = await nextValue;
          }

          const nextValues = Array.isArray(nextValue) ? nextValue : [nextValue];

          for (const value of nextValues) {
            if (isHTML(value)) {
              rendered += String(await value.render());
            } else {
              rendered += String(value);
            }
          }
        }
      }

      // Find indent level of least indented line.
      const lines = rendered.split("\n");
      const mindent = lines.reduce((mindent, line) => {
        const match = line.match(/^(\s+)\S+/);
        if (match) {
          let indent = match[1].length;
          if (!mindent) {
            return indent;
          } else {
            return Math.min(mindent, indent);
          }
        }
        return mindent;
      }, 0);

      // Strip minimum indentation from each indented line.
      if (mindent !== null) {
        rendered = lines
          .map((line) => {
            return line[0] === " " ? line.slice(mindent) : line;
          })
          .join("\n");
      }

      // Trim preserving newlines.
      return rendered.trim().replace(/\\n/g, "\n");
    },
  };
}

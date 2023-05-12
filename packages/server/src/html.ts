import { typeOf, isString, isArray, isArrayOf, isFunction, isObject, isNumber, isBoolean } from "@borf/bedrock";
import htm from "htm";

export interface HTMLTemplate {
  render(scope?: RenderScope): Promise<string>;
}

interface RenderScope {
  children?: HTMLTemplate[];
}

export function isHTML(value: unknown): value is HTMLTemplate {
  return (isObject(value) && isFunction(value.render)) || isArrayOf(isHTML, value);
}

export async function render(templates: HTMLTemplate | HTMLTemplate[] | string, scope?: RenderScope): Promise<string> {
  const list = isArray(templates) ? templates : [templates];

  let rendered = "";

  for (const template of list) {
    if (isString(template)) {
      rendered += template;
    } else {
      rendered += await template.render(scope);
    }
  }

  return rendered;
}

function h(tag: string, attributes: any, ...children: any[]): HTMLTemplate;
function h(component: () => unknown, attributes: any, ...children: any[]): HTMLTemplate;

function h(element: string | ((attributes: any) => unknown), attributes: any, ...children: any[]) {
  console.log({ element, attributes, children });

  const filteredChildren: HTMLTemplate[] = children
    .filter((child) => child != null && child !== false)
    .map((child) => {
      if (isHTML(child)) {
        return child;
      }

      if (isNumber(child) || isString(child) || isBoolean(child)) {
        return { render: async () => String(child) };
      }

      throw new Error(`Unexpected child type: ${typeOf(child)}, value: ${child}`);
    })
    .flat();

  return {
    async render(scope?: RenderScope) {
      if (isFunction(element)) {
        // Component
        // TODO: Pass context as second argument
        const templates = await element(attributes);

        if (templates === null) {
          return "";
        }

        if (!isHTML(templates)) {
          console.error({ element, attributes, templates });
          throw new Error(`View function must return HTMLTemplates. Got: ${templates}`);
        }

        return render(templates, { children: filteredChildren });
      } else {
        // HTML element

        let rendered = "";

        rendered += `<${element}`;

        // Attributes
        for (const key in attributes) {
          rendered += ` ${key}="${String(attributes[key])}"`;
        }

        rendered += ">";

        // Children
        rendered += await render(filteredChildren, { children: filteredChildren });

        rendered += `</${element}>`;

        return rendered;
      }
    },
  };
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
export const html = htm.bind(h);

// export function html(strings: TemplateStringsArray, ...values: unknown[]) {
//   return {
//     async render() {
//       let rendered = "";

//       for (const str of strings) {
//         rendered += str;
//         let nextValue = values.shift();

//         if (nextValue) {
//           if (isPromise(nextValue)) {
//             nextValue = await nextValue;
//           }

//           const nextValues = Array.isArray(nextValue) ? nextValue : [nextValue];

//           for (const value of nextValues) {
//             if (isHTML(value)) {
//               rendered += String(await value.render());
//             } else {
//               rendered += String(value);
//             }
//           }
//         }
//       }

//       // Find indent level of least indented line.
//       const lines = rendered.split("\n");
//       const mindent = lines.reduce((mindent, line) => {
//         const match = line.match(/^(\s+)\S+/);
//         if (match) {
//           let indent = match[1].length;
//           if (!mindent) {
//             return indent;
//           } else {
//             return Math.min(mindent, indent);
//           }
//         }
//         return mindent;
//       }, 0);

//       // Strip minimum indentation from each indented line.
//       if (mindent !== null) {
//         rendered = lines
//           .map((line) => {
//             return line[0] === " " ? line.slice(mindent) : line;
//           })
//           .join("\n");
//       }

//       // Trim preserving newlines.
//       return rendered.trim().replace(/\\n/g, "\n");
//     },
//   };
// }

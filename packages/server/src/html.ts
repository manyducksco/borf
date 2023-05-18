import htm from "htm";
import { typeOf, isString, isArray, isArrayOf, isFunction, isObject, isNumber, isBoolean } from "@borf/bedrock";
import { type DebugChannel } from "./classes/DebugHub.js";
import { type Store, type ComponentContext } from "./component.js";
import { type AppContext } from "./classes/App/App.js";

export interface HTMLTemplate {
  render(config: RenderConfig): Promise<string>;
}

export interface RenderConfig {
  appContext: AppContext;
}

export function isHTML(value: unknown): value is HTMLTemplate | HTMLTemplate[] {
  return (isObject(value) && isFunction(value.render)) || isArrayOf(isHTML, value);
}

export async function render(templates: HTMLTemplate | HTMLTemplate[] | string, config: RenderConfig): Promise<string> {
  const list = isArray(templates) ? templates : [templates];

  let rendered = "";

  for (const template of list) {
    if (isString(template)) {
      rendered += template;
    } else {
      rendered += await template.render(config);
    }
  }

  return rendered;
}

function h(tag: string, attributes: any, ...children: any[]): HTMLTemplate;
function h<A>(
  component: (attrs: A, ctx: ComponentContext) => unknown,
  attributes: any,
  ...children: any[]
): HTMLTemplate;

function h<A>(element: string | ((attrs: A, ctx: ComponentContext) => unknown), attributes: any, ...children: any[]) {
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
    async render(config: RenderConfig) {
      if (isFunction(element)) {
        // Component

        const ctx: Omit<ComponentContext, keyof DebugChannel> = {
          name: element.name ?? "anonymous",
          use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T> {
            if (config.appContext.stores.has(store)) {
              return config.appContext.stores.get(store)?.instance!.exports as any;
            }

            throw new Error(`Store '${store.name}' is not registered on this app.`);
          },
          outlet(): HTMLTemplate {
            return {
              async render(config) {
                return render(filteredChildren, config);
              },
            };
          },
        };

        const debugChannel = config.appContext.debugHub.channel({
          get name() {
            return ctx.name;
          },
        });

        Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(debugChannel));

        const templates = await element(attributes, ctx as ComponentContext);

        if (templates === null) {
          return "";
        }

        if (!isHTML(templates)) {
          console.error({ element, attributes, templates });
          throw new Error(`View function must return HTMLTemplates. Got: ${templates}`);
        }

        return render(templates, config);
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
        rendered += await render(filteredChildren, config);

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

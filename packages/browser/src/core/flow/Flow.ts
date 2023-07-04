import { Readable } from "../state.js";
import { ComponentContext } from "../component.js";
import { html } from "../markup/index.js";
import { type FlowDefaultAttributes, FlowStore } from "./FlowStore.js";

export interface FlowAttributes extends FlowDefaultAttributes {
  right?: boolean | Readable<boolean> | Readable<boolean | undefined>;
  left?: boolean | Readable<boolean> | Readable<boolean | undefined>;
  up?: boolean | Readable<boolean> | Readable<boolean | undefined>;
  down?: boolean | Readable<boolean> | Readable<boolean | undefined>;
  scroll?: boolean | Readable<boolean> | Readable<boolean | undefined>;
}

export function Flow(attrs: FlowAttributes, ctx: ComponentContext) {
  const store = ctx.use(FlowStore);

  return html`<section>${ctx.outlet()}</section>`;
}

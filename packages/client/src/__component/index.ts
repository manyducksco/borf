import { HTMLComponent, $Attributes } from "../dolla/HTMLComponent";

export * from "./Component";
export * from "../dolla/HTMLComponent";

import { $text } from "../dolla/text";
import { $map } from "../dolla/map";
import { $when } from "../dolla/when";

export function $(tagName: string, props: $Attributes) {
  return new HTMLComponent(tagName, props);
}

$.text = $text;
$.map = $map;
$.when = $when;

import { HTMLComponent, HTMLComponentProps } from "./HTMLComponent";

export * from "./Component";
export * from "./HTMLComponent";

import { $text } from "./$text";
import { $map } from "./$map";
import { $when } from "./$when";

export function $(tagName: string, props: HTMLComponentProps) {
  return new HTMLComponent(tagName, props);
}

$.text = $text;
$.map = $map;
$.when = $when;

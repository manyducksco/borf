import { isString } from "../utils";
import { HTMLComponent, HTMLComponentProps } from "./HTMLComponent";

export * from "./Component";
export * from "./HTMLComponent";
export * from "./$text";
export * from "./$map";
export * from "./$when";

export const E = (tagName: string, props: HTMLComponentProps) => {
  return new HTMLComponent(tagName, props);
};

import { HTMLComponent, HTMLComponentProps } from "./HTMLComponent";

const baseElement = (tagName: string) => (props: HTMLComponentProps) =>
  new HTMLComponent(tagName, props);

/*===========================*\
||      Basic Components     ||
\*===========================*/

export const button = baseElement("button");
export const div = baseElement("div");
export const h1 = baseElement("h1");
export const h2 = baseElement("h2");
export const h3 = baseElement("h3");
export const h4 = baseElement("h4");
export const h5 = baseElement("h5");
export const input = baseElement("input");
export const li = baseElement("li");
export const ol = baseElement("ol");
export const p = baseElement("p");
export const section = baseElement("section");
export const span = baseElement("span");
export const ul = baseElement("ul");

/*===========================*\
||     Specialty Elements    ||
\*===========================*/

export * from "./$text";
export * from "./$map";
export * from "./$when";

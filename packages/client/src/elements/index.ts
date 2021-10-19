import { BaseComponentProps, BaseComponent } from "./BaseComponent.js";

const baseElement = (tag: string) => (props: BaseComponentProps) =>
  new BaseComponent(document.createElement(tag), props);

/*===========================*\
||       Basic Elements      ||
\*===========================*/

export const div = baseElement("div");
export const section = baseElement("section");
export const ul = baseElement("ul");
export const ol = baseElement("ol");
export const li = baseElement("li");
export const button = baseElement("button");
export const input = baseElement("input");
export const h1 = baseElement("h1");
export const h2 = baseElement("h2");
export const h3 = baseElement("h3");
export const h4 = baseElement("h4");
export const h5 = baseElement("h5");
export const p = baseElement("p");
export const span = baseElement("span");

/*===========================*\
||     Specialty Elements    ||
\*===========================*/

export * from "./$text";
export * from "./$map";
export * from "./$when";

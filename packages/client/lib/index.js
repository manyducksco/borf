import { makeApp } from "./makers/makeApp.js";

export const woof = makeApp;
export default makeApp;

export { makeView } from "./makers/makeView.js";
export { makeGlobal } from "./makers/makeGlobal.js";
export { makeTransitions } from "./makers/makeTransitions.js";

export { h } from "./h.js";
export { Fragment } from "./views/Fragment.js";

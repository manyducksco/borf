export { makeApp } from "./makeApp.js";
export { makeState, mergeStates } from "@woofjs/state";
export { Component } from "./Component.js";
export { Service } from "./Service.js";

export { Styles } from "../_etc/Styles.js";

// Naming conventions:
// - Variables starting with $ are states.
// - Methods starting with _ are lifecycle hooks.
// - Functions starting with 'make' create important objects.
// - Plain classes like Component, Service are designed to be extended.

// const app = makeApp({
//   hash: true,
// });

// const server = makeServer();

// function test() {
//   const { $attrs } = this;

//   // If rendering a non-state from $attrs
//   $.text($attrs.map("firstName"));

//   // Or if getting a state from $attrs
//   $.text($attrs.get("$firstName"));

//   <button onclick={$attrs.get("onclick")}>Click me</button>;
// }

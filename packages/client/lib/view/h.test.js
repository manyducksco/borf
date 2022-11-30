import { h } from "./h.js";
import { makeState } from "../helpers/state.js";
import { isBlueprint } from "../helpers/typeChecking.js";
import { makeDebug } from "../helpers/makeDebug.js";
import { makeDOMNode } from "./helpers/initView.test.js";

const appContext = {
  globals: {},
  debug: makeDebug(),
};

describe("h", () => {
  test("returns an element template", () => {
    const element = h("div");

    expect(isBlueprint(element)).toBe(true);
  });

  describe("h.when", () => {
    test("a", () => {
      const $$value = makeState(false);
      const element = h.when(
        $$value,
        h("div", { id: "truthy-item" }, "Value is truthy"),
        h("div", { id: "falsy-item" }, "Value is falsy")
      );

      const parent = makeDOMNode();
      const view = element.build({
        appContext,
      });

      view.connect(parent);

      $$value.set(true);

      console.log(parent.children);
    });
  });

  describe("h.unless", () => {});

  describe("h.match", () => {});

  describe("h.repeat", () => {});
});

import { makeState } from "../makeState.js";
import { makeMockDOMNode } from "../testing/makeMockDOMNode.js";
import { m } from "./markup.js";
import { isBlueprint } from "./typeChecking.js";
import { makeDebug } from "./makeDebug.js";

const appContext = {
  globals: {},
  debug: makeDebug(),
};

describe("m", () => {
  test("returns a blueprint", () => {
    const element = m("div");

    expect(isBlueprint(element)).toBe(true);
  });

  describe("m.when", () => {
    test("a", () => {
      const $$value = makeState(false);
      const element = m.when(
        $$value,
        m("div", { id: "truthy-item" }, "Value is truthy"),
        m("div", { id: "falsy-item" }, "Value is falsy")
      );

      const parent = makeMockDOMNode();
      const view = element.build({
        appContext,
      });

      view.connect(parent);

      $$value.set(true);

      console.log(parent.children);
    });
  });

  describe("m.unless", () => {});

  describe("m.match", () => {});

  describe("m.observe", () => {});

  describe("m.repeat", () => {});
});

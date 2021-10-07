/**
 * @jest-environment jsdom
 */

import { StateSubscription } from "../states/State";
import { Element } from "../elements/Element";
import {
  isArray,
  isFloat,
  isInteger,
  isNumber,
  isObject,
  isString,
  isSubscription,
  isBinding,
  isElement,
} from "./typeChecking";

describe("isArray", () => {
  test("identifies arrays", () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
  });
});

describe("isFloat", () => {
  test("identifies numbers with fractional digits", () => {
    expect(isFloat(1.5)).toBe(true);
    expect(isFloat(1)).toBe(false);
    expect(isFloat("5.24")).toBe(false);
  });
});

describe("isInteger", () => {
  test("identifies numbers without fractional digits", () => {
    expect(isInteger(1)).toBe(true);
    expect(isInteger(5.12)).toBe(false);
    expect(isInteger("50")).toBe(false);
  });
});

describe("isNumber", () => {
  test("identifies numbers", () => {
    expect(isNumber(1)).toBe(true);
    expect(isNumber(5.3)).toBe(true);
    expect(isNumber("600")).toBe(false);
  });
});

describe("isString", () => {
  test("identifies strings", () => {
    expect(isString(null)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString("a")).toBe(true);
    expect(isString("")).toBe(true);
  });
});

describe("isObject", () => {
  test("identifies objects", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject({})).toBe(true);
    expect(isObject("a")).toBe(false);
    expect(isObject(class {})).toBe(false);
  });
});

describe("isSubscription", () => {
  test("identifies subscription objects", () => {
    expect(isSubscription(5)).toBe(false);
    expect(
      isSubscription({
        active: true,
        receiver: () => {},
        cancel: () => {},
      })
    ).toBe(true);
    expect(
      isSubscription({
        active: false,
        receiver: null,
        cancel: () => {},
      })
    ).toBe(true);
    expect(
      isSubscription({
        receiver: null,
        cancel: () => {},
      })
    ).toBe(false);
  });
});

describe("isBinding", () => {
  test("identifies binding objects", () => {
    expect(isBinding(null)).toBe(false);
    expect(isBinding(() => {})).toBe(false);

    // subscription, but not binding
    expect(
      isBinding({
        active: true,
        receiver: () => {},
        cancel: () => {},
      })
    ).toBe(false);

    expect(
      isBinding({
        active: true,
        receiver: () => {},
        cancel: () => {},
        set: () => {},
      })
    ).toBe(true);
  });
});

describe("isElement", () => {
  test("identifies Elements", () => {
    expect(isElement(null)).toBe(false);

    const el = new Element({
      extends: "div",
    });
    expect(isElement(el)).toBe(true);
  });
});

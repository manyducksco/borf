import { isArray, isObservable, isDOM, isString, isNumber, isFunction, isObject, isBlueprint } from "./typeChecking.js";
import { flatten } from "./flatten.js";
import { TextBlueprint } from "../blueprints/Text.js";
import { ViewBlueprint } from "../blueprints/View.js";

/**
 * Convert renderable elements into an array of blueprints, ready to build and connect.
 */
export function toBlueprints(elements) {
  if (elements == null) {
    return [];
  }

  if (!isArray(elements)) {
    elements = [elements];
  }

  elements = flatten(elements);

  const blueprints = [];

  for (let item of elements) {
    const blueprint = toBlueprint(item);

    if (blueprint == null) {
      continue;
    }

    blueprints.push(blueprint);
  }

  return blueprints;
}

/**
 * Turn an unknown object into a renderable value.
 */
export function toBlueprint(element) {
  if (element == null || element === false) {
    return null;
  }

  if (isBlueprint(element)) {
    return element;
  }

  // Standalone View setup functions.
  if (isFunction(element)) {
    return new ViewBlueprint(element);
  }

  // Plain View config object.
  if (isObject(element) && isFunction(element.setup)) {
    return new ViewBlueprint(element);
  }

  if (element.isBlueprint) {
    return element;
  }

  if (element.isView) {
    return {
      isBlueprint: true,
      build() {
        return element;
      },
    };
  }

  if (isDOM(element)) {
    return {
      isBlueprint: true,
      build() {
        return new DOMAdapterView(element);
      },
    };
  }

  if (isObservable(element) || isString(element) || isNumber(element)) {
    return new TextBlueprint(element);
  }

  throw new TypeError(`Children must be a DOM node, string, number, function, or null. Got: ${element}`);
}

/**
 * Wraps a DOM node in a View API.
 */
class DOMAdapterView {
  get isView() {
    return true;
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  constructor(node) {
    this.node = node;
  }

  connect(parent, after = null) {
    parent.insertBefore(this.node, after?.nextSibling);
  }

  disconnect() {
    this.node.parentNode?.removeChild(this.node);
  }
}

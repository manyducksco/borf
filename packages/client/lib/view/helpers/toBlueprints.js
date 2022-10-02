import { isArray, isNumber, isObservable, isString } from "../../helpers/typeChecking.js";
import { flatten } from "../../helpers/flatten.js";
import { TextBlueprint } from "../blueprints/Text.js";

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
    if (item === null || item === undefined || item === false) {
      continue;
    }

    if (isString(item) || isNumber(item) || isObservable(item)) {
      item = new TextBlueprint(item);
    }

    // TODO: Find out why views are being passed to this function and remove this.
    if (item.isView) {
      console.trace(`view passed to toBlueprints`);
      console.log(item);
      const view = item;
      item = {
        isBlueprint: true,
        build() {
          return view;
        },
      };
    }

    if (!item.isBlueprint) {
      const index = elements.indexOf(item);
      console.log({ item, index, elements });
      throw new TypeError(
        `Children must be elements, objects with a '.toString()' method, or null. Got unknown item at index ${index}: ${item}`
      );
    }

    blueprints.push(item);
  }

  return blueprints;
}

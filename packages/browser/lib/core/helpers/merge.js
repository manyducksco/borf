import { Type } from "@borf/bedrock";

/**
 * Takes an old value and a new value.  Returns a merged copy if both are objects, otherwise returns the new value.
 */
export function merge(one, two) {
  if (Type.isObject(one)) {
    if (!Type.isObject(two)) {
      return two;
    }

    const merged = Object.assign({}, one);

    for (const key in two) {
      merged[key] = merge(merged[key], two[key]);
    }

    return merged;
  } else {
    return two;
  }
}

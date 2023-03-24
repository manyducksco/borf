import { Type } from "@borf/bedrock";

export function deepEqual(one, two) {
  if (one === two) {
    return true;
  }

  if (Type.isObject(one) && Type.isObject(two)) {
    const keysOne = Object.keys(one);
    const keysTwo = Object.keys(two);

    if (keysOne.length !== keysTwo.length) {
      return false;
    }

    for (const key in one) {
      if (!deepEqual(one[key], two[key])) {
        return false;
      }
    }

    return true;
  }

  if (Type.isArray(one) && Type.isArray(two)) {
    if (one.length !== two.length) {
      return false;
    }

    for (const index in one) {
      if (!deepEqual(one[index], two[index])) {
        return false;
      }
    }

    return true;
  }

  return one === two;
}
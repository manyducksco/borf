export const isObject = (value) => value != null && typeof value === "object" && !Array.isArray(value);
export const isFunction = (value) => typeof value === "function";
export const isString = (value) => typeof value === "string";
export const isArray = (value) => Array.isArray(value);

export function deepEqual(one, two) {
  if (one === two) {
    return true;
  }

  if (isObject(one) && isObject(two)) {
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

  if (isArray(one) && isArray(two)) {
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

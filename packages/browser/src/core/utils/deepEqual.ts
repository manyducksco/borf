function isPlainObject<T = { [name: string]: any }>(value: any): value is T {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.getPrototypeOf({})
  );
}

export function deepEqual(one: any, two: any) {
  if (one === two) {
    return true;
  }

  if (isPlainObject(one) && isPlainObject(two)) {
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

  if (Array.isArray(one) && Array.isArray(two)) {
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

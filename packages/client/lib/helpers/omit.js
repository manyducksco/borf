/**
 * Returns a new object without the specified keys.
 *
 * @param keys - An array of keys to omit.
 * @param object - An object to clone without the omitted keys.
 */
export function omit(keys, object) {
  const newObject = {};

  for (const key in object) {
    if (!keys.includes(key)) {
      newObject[key] = object[key];
    }
  }

  return newObject;
}

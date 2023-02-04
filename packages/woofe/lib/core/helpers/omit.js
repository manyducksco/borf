/**
 * Returns a new object without the specified keys.
 * If called without object, returns a function that takes an object
 * and returns a version with the original keys omitted.
 *
 * @param keys - An array of keys to omit.
 * @param object - An object to clone without the omitted keys.
 */
export function omit(keys, object) {
  const process = (object) => {
    const newObject = {};

    for (const key in object) {
      if (!keys.includes(key)) {
        newObject[key] = object[key];
      }
    }

    return newObject;
  };

  if (object == null) {
    return process;
  }

  return process(object);
}

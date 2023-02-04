/**
 * Returns a new object with only the specified keys.
 * If called without object, returns a function that takes an object
 * and returns a version with only the specified keys.
 *
 * @param keys - An array of keys to keep.
 * @param object - An object to clone with only the picked keys.
 */
export function pick(keys, object) {
  const process = (object) => {
    const newObject = {};

    for (const key in object) {
      if (keys.includes(key)) {
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

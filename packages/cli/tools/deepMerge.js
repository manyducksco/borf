/**
 * Returns a new object in which nested objects are merged instead of replaced.
 * All non-object properties are replaced.
 */
module.exports = function deepMerge(one, two) {
  if (typeof one === "object" && !Array.isArray(one)) {
    if (typeof two === "object" && !Array.isArray(two)) {
      const merged = {
        ...one,
      };

      for (const key in two) {
        if (two[key] !== undefined) {
          merged[key] = deepMerge(one[key], two[key]);
        }
      }

      return merged;
    }
  }

  return two;
};

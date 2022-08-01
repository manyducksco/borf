export function cloneDeep(object) {
  if (object == null || typeof object !== "object") {
    return object;
  }

  let clone;

  if (Array.isArray(object)) {
    clone = [];
  } else {
    clone = {};
  }

  for (const key in object) {
    clone[key] = cloneDeep(object[key]);
  }

  return clone;
}

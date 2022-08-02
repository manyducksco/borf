import { isState } from "./typeChecking";

export function cloneDeep(object) {
  if (object == null || typeof object !== "object" || isState(object)) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map(cloneDeep);
  }

  const clone = {};

  for (const key in object) {
    clone[key] = cloneDeep(object[key]);
  }

  return clone;
}

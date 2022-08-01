import { cloneDeep } from "../helpers/cloneDeep.js";

/**
 * Takes the original value and a function that receives that value.
 * If the function returns a value, that value is returned from this function.
 * If the function doesn't return a value, returns a cloned version of the value
 * that may have been mutated by the function.
 *
 * This is a lighter weight substitute for immer's produce function.
 * This implementation has the same result for our purposes.
 */
export function produce(value, fn) {
  const cloned = cloneDeep(value);
  const result = fn(cloned);

  if (result !== undefined) {
    return result; // Set value if returned from function.
  } else {
    return cloned; // Assume cloned value was mutated instead of returned.
  }
}

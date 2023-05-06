import { isObject } from "@borf/bedrock";

export function merge<A extends Record<any, any>, B extends Record<any, any>>(a: A, b: B): A & B;

export function merge<A = unknown, B = unknown>(a: A, b: B): B;

/**
 * Takes an old value and a new value.  Returns a merged copy if both are objects, otherwise returns the new value.
 */
export function merge<A = any, B = any>(a: A, b: B) {
  if (isObject(a)) {
    if (!isObject(b)) {
      return b;
    }

    const merged: Record<any, any> = Object.assign({}, a);

    for (const key in b) {
      merged[key] = merge(merged[key], b[key]);
    }

    return merged;
  } else {
    return b;
  }
}

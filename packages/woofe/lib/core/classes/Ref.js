/**
 * References the raw HTMLElement of a view when passed as its `ref` attribute.
 */
export class Ref {
  static isRef(value) {
    return value instanceof Ref;
  }

  element;
}

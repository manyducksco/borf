/**
 * References the root DOM node of a view when passed as its `ref` attribute.
 */
export class Ref<T = HTMLElement> {
  static isRef<T>(value: unknown): value is Ref<T> {
    return value instanceof Ref;
  }

  element!: T;
}

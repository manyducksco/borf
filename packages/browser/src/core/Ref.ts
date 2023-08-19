export function isRef<T>(value: any): value is Ref<T> {
  return value != null && typeof value === "object" && value.hasOwnProperty("current");
}

export interface Ref<T> {
  current: T;
}

export function ref<T>(value?: undefined): Ref<T | undefined>;
export function ref<T>(value: null): Ref<T>;
export function ref<T>(value: T): Ref<T>;

export function ref(value: any) {
  return {
    current: value,
  };
}

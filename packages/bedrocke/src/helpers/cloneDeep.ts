export function cloneDeep(value: Date): Date;
export function cloneDeep<K, V>(value: Map<K, V>): Map<K, V>;
export function cloneDeep<T>(value: T[]): T[];
export function cloneDeep<T>(value: T): T;

export function cloneDeep(value: any) {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (value instanceof Map) {
    const entries: any[] = [...value.entries()].map(cloneDeep);
    return new Map(entries);
  }

  if (Array.isArray(value)) {
    return [...value.map(cloneDeep)];
  }

  if (value != null && typeof value === "object") {
    const cloned: any = {};

    for (const [key, val] of Object.entries(value)) {
      cloned[key] = cloneDeep(val);
    }

    return cloned;
  }

  // Return everything else as-is.
  return value;
}

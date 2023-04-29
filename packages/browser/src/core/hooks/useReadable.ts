import { type Readable, type ValuesOfReadables } from "../classes/Writable.js";
import { getCurrentComponent } from "../keys.js";

export function useReadable<T>(readable: Readable<T>, callback: (value: T) => void): void;
export function useReadable<T extends Readable<any>[], V>(
  readables: T,
  callback: (...value: ValuesOfReadables<T>) => void
): void;

export function useReadable(readable: any, callback: any) {
  const core = getCurrentComponent();
  return core.observe(readable, callback);
}

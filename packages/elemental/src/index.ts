export {
  Readable,
  Writable,
  Spring,
  Ref,
  Outlet,
  Fragment,
  when,
  unless,
  repeat,
  observe,
} from "@borf/browser";

import htm from "htm/mini";
import { m } from "@borf/browser";

export const html = htm.bind(m);

export function defineElement(tag: string, component: unknown) {}

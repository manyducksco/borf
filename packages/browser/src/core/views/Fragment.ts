import { m } from "../classes/Markup.js";
import { Outlet } from "./Outlet.js";

export function Fragment() {
  return m(Outlet);
}

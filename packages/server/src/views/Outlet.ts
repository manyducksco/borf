import { type HTMLTemplate } from "../html.js";

export function Outlet(): HTMLTemplate {
  // Do nothing. If this function is used as a view, the parent view's children are rendered.
  return null as unknown as HTMLTemplate;
}

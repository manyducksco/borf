import { m } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (self) {
  self.setName("7GUIs:CircleDrawer");

  return m(ExampleFrame, { title: "6. Circle Drawer" }, [m("div")]);
}

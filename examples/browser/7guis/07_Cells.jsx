import { m } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (self) {
  self.setName("7GUIs:Cells");

  return m(ExampleFrame, { title: "7. Cells" }, [m("div")]);
}

import { m } from "@borf/browser";

export default function (self) {
  return m.div(
    m.p({ style: { padding: "1rem 1rem 0 1rem" } }, [
      "This is an implementation of ",
      m.a({ href: "https://eugenkiss.github.io/7guis/" }, "7GUIs"),
      ", a system for evaluating UI frameworks.",
    ]),

    m.div(self.outlet())
  );
}

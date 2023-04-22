import { Writable, when } from "@borf/browser";
import { ExampleFrame } from "./ExampleFrame";

export function RenderOrderTest(self) {
  const $$isTrue = new Writable(true);

  let interval;

  self.onConnected(() => {
    interval = setInterval(() => {
      $$isTrue.update((t) => !t);
    }, 1000);
  });

  self.onDisconnected(() => {
    clearInterval(interval);
  });

  return m(ExampleFrame, { title: "Render Order Test" }, [
    m("p", "You should be seeing these in the order: 1 a 2 b 3 c 4 5 d"),

    m("ul", [
      when($$isTrue, m(SubView, { value: 1 })),
      m(SubView, { value: "a" }),
      when($$isTrue, m(SubView, { value: 2 })),
      m(SubView, { value: "b" }),
      when($$isTrue, m(SubView, { value: 3 })),
      m(SubView, { value: "c" }),
      when($$isTrue, m(SubView, { value: 4 })),
      when($$isTrue, m(SubView, { value: 5 })),
      m(SubView, { value: "d" }),
    ]),
  ]);
}

function SubView(self) {
  const { value } = self.inputs.get();

  return m("li", value);
}

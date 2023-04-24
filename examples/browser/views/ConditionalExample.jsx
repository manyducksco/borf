import { Writable, Spring, m } from "@borf/browser";

export function ConditionalExample(self) {
  const $$show = new Writable(false);
  const $label = $$show.map((t) => (t ? "Hide Text" : "Show Text"));

  return m.div({ class: "example" }, [
    m.h3("Conditional rendering with ", m.code("when()")),
    m.div(
      m.button(
        {
          style: { width: 100 },
          onclick: () => {
            $$show.update((x) => !x);
          },
        },
        $label
      ),
      m.$if($$show, m(Message))
    ),
  ]);
}

function Message(self) {
  const opacity = new Spring({
    stiffness: 200,
    damping: 50,
    initialValue: 0,
  });
  const y = new Spring({
    stiffness: 200,
    damping: 50,
    initialValue: -10,
  });

  self.beforeConnected(() => Promise.all([opacity.to(1), y.to(0)]));
  self.beforeDisconnected(() => Promise.all([opacity.to(0), y.to(-10)]));

  return m.span(
    {
      style: {
        display: "inline-block",
        paddingLeft: "0.5rem",
        opacity: opacity,
        transform: y.map((y) => `translateY(${y}px)`),
      },
    },
    "Hello there!"
  );
}

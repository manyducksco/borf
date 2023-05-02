import { when, useConnected, useDisconnected, Writable } from "@borf/browser";
import { ExampleFrame } from "./ExampleFrame";

export function RenderOrderTest() {
  const $$isTrue = new Writable(true);

  let interval;

  useConnected(() => {
    interval = setInterval(() => {
      $$isTrue.update((t) => !t);
    }, 1000);
  });

  useDisconnected(() => {
    clearInterval(interval);
  });

  return (
    <ExampleFrame title="Render Order Test">
      {when($$isTrue, <SubView value={1} />)}
      <SubView value="a" />
      {when($$isTrue, <SubView value={2} />)}
      <SubView value="b" />
      {when($$isTrue, <SubView value={3} />)}
      <SubView value="c" />
      {when($$isTrue, <SubView value={4} />)}
      {when($$isTrue, <SubView value={5} />)}
      <SubView value="d" />
    </ExampleFrame>
  );
}

function SubView({ value }) {
  return <li>{value}</li>;
}

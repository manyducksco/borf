import { cond, writable } from "@borf/browser";
import { ExampleFrame } from "./ExampleFrame";

export function RenderOrderTest(_, ctx) {
  const $$isTrue = writable(true);

  let interval;

  ctx.onConnected(() => {
    interval = setInterval(() => {
      $$isTrue.update((t) => !t);
    }, 1000);
  });

  ctx.onDisconnected(() => {
    clearInterval(interval);
  });

  return (
    <ExampleFrame title="Render Order Test">
      <p>
        The order below when numbers are visible should be: 1 a 2 b 3 c 4 5 d
      </p>

      {cond($$isTrue, <SubView value={1} />)}
      <SubView value="a" />
      {cond($$isTrue, <SubView value={2} />)}
      <SubView value="b" />
      {cond($$isTrue, <SubView value={3} />)}
      <SubView value="c" />
      {cond($$isTrue, <SubView value={4} />)}
      {cond($$isTrue, <SubView value={5} />)}
      <SubView value="d" />
    </ExampleFrame>
  );
}

function SubView({ value }) {
  return <li>{value}</li>;
}

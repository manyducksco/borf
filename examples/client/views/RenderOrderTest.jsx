import { makeState, makeView } from "@woofjs/client";

export const RenderOrderTest = makeView((ctx, h) => {
  const $$isTrue = makeState(true);

  let interval;

  ctx.afterConnect(() => {
    interval = setInterval(() => {
      $$isTrue.update((t) => !t);
    }, 1000);
  });

  ctx.beforeDisconnect(() => {
    clearInterval(interval);
  });

  return (
    <ul>
      {h.when($$isTrue, <SubView value={1} />)}
      <SubView value="a" />
      {h.when($$isTrue, <SubView value={2} />)}
      <SubView value="b" />
      {h.when($$isTrue, <SubView value={3} />)}
      <SubView value="c" />
      {h.when($$isTrue, <SubView value={4} />)}
      {h.when($$isTrue, <SubView value={5} />)}
      <SubView value="d" />
    </ul>
  );
});

const SubView = makeView((ctx) => {
  const { value } = ctx.attrs;

  return <li>{value}</li>;
});

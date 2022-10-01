import { makeView } from "@woofjs/client";

export const RenderOrderTest = makeView((ctx) => {
  ctx.defaultState = {
    isTrue: true,
  };

  let interval;

  ctx.afterConnect(() => {
    interval = setInterval(() => {
      ctx.set("isTrue", (t) => !t);
    }, 1000);
  });

  ctx.beforeDisconnect(() => {
    clearInterval(interval);
  });

  return (
    <ul>
      {ctx.when("isTrue", <SubView value={1} />)}
      <SubView value="a" />
      {ctx.when("isTrue", <SubView value={2} />)}
      <SubView value="b" />
      {ctx.when("isTrue", <SubView value={3} />)}
      <SubView value="c" />
      {ctx.when("isTrue", <SubView value={4} />)}
      {ctx.when("isTrue", <SubView value={5} />)}
      <SubView value="d" />
    </ul>
  );
});

const SubView = makeView((ctx) => {
  const $value = ctx.readable("value");

  return <li>{$value}</li>;
});

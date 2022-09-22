export default function mockPage(ctx) {
  ctx.defaultState = {
    title: "Test",
  };

  return {
    $$title: ctx.writable("title"),
  };
}

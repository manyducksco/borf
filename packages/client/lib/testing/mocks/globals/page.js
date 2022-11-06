export default function mockPage(ctx) {
  return {
    $$title: ctx.state("Test"),
    $visibility: ctx.state("visible").readable(),
  };
}

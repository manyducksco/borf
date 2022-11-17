import { makeView, makeState } from "@woofjs/client";

export const ComponentAttrsExample = makeView((ctx) => {
  ctx.name = "ComponentAttrsExample";

  const $$message = makeState("test");

  return (
    <div class="example">
      <h3>Component Attributes</h3>
      <div>
        <input type="text" value={$$message} />
        <hr />
        <SubComponent $$message={$$message} />
      </div>
    </div>
  );
});

const SubComponent = makeView((ctx) => {
  ctx.name = "SubComponent";

  const { $$message } = ctx.attrs;

  return (
    <div>
      <p>Message: {$$message}</p>
      <button
        onclick={() => {
          $$message.set("test");
        }}
      >
        Reset State
      </button>
    </div>
  );
});

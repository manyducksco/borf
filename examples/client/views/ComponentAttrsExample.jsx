import { makeView, makeState } from "@woofjs/client";

export const ComponentAttrsExample = makeView({
  name: "ComponentAttrsExample",
  setup: () => {
    const $$message = makeState("Hello");

    return (
      <div class="example">
        <h3>Component Attributes</h3>
        <div>
          <input type="text" value={$$message} />
          <hr />
          <SubComponent message={$$message} />
        </div>
      </div>
    );
  },
});

const SubComponent = makeView({
  name: "SubComponent",
  attributes: {
    message: {
      type: "string",
      required: true,
      writable: true,
    },
  },
  setup: (ctx) => {
    const $$message = ctx.attrs.writable("message");

    return (
      <div>
        <p>Message: {$$message}</p>
        <button
          onclick={() => {
            $$message.set("Hello");
          }}
        >
          Reset State
        </button>
      </div>
    );
  },
});

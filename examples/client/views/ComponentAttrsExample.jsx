import { makeView, makeState, withName, withAttributes } from "@woofjs/client";

export const ComponentAttrsExample = makeView(
  withName("ComponentAttrsExample"),
  (ctx) => {
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
  }
);

const SubComponent = makeView(
  withName("SubComponent"),
  withAttributes({
    message: {
      type: "string",
    },
  }),
  (ctx) => {
    const $$message = ctx.attributes.writable("message");

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
  }
);

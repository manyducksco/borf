import { View, makeState } from "@borf/browser";

export class ComponentInputsExample extends View {
  static about = "Demonstrates passing inputs to a subview.";

  setup(ctx, m) {
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
}

class SubComponent extends View {
  static about =
    "Demonstrates working with attribute bindings passed from a superview.";
  static inputs = {
    message: {
      type: "string",
      required: true,
      writable: true,
    },
  };

  setup(ctx) {
    const $$message = ctx.inputs.$$("message");

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
}

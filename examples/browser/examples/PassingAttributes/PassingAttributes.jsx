import { View, Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./PassingAttributes.module.css";

export const PassingAttributes = new View({
  label: "PassingAttributes",
  about: "Demonstrates passing attributes to a subview.",
  // inputs: {
  //   something: {
  //     // TODO: Return type of `parse` is the type
  //     parse: (x) => {
  //       if (x === undefined) {
  //         return "5";
  //       }

  //       if (typeof x !== "string" || isNaN(Number(x))) {
  //         throw new TypeError(`'something' input must be a numeric string`);
  //       }

  //       return x;
  //     },
  //   },
  // },
  setup(ctx, m) {
    const $$message = new Writable("Hello");

    return (
      <ExampleFrame>
        <h3>Passing Attributes</h3>
        <div>
          {/* Input values support two way binding, so changes here will propagate to $$message and vice versa */}
          <input type="text" value={$$message} />
          <hr />
          {/* Passing a writable state for two-way binding */}
          <SubView message={$$message} />
        </div>
      </ExampleFrame>
    );
  },
});

// export class PassingAttributes extends View {
//   static about = "Demonstrates passing attributes to a subview.";

//   setup(ctx, m) {

//     const $$message = new State("Hello");

//     return (
//       <ExampleFrame>
//         <h3>Passing Attributes</h3>
//         <div>
//           {/* Input values support two way binding, so changes here will propagate to $$message and vice versa */}
//           <input type="text" value={$$message} />
//           <hr />
//           {/* Passing a writable state for two-way binding */}
//           <SubView message={$$message} />
//         </div>
//       </ExampleFrame>
//     );
//   }
// }

const SubView = new View({
  about:
    "Demonstrates working with attribute bindings passed from a superview.",
  inputs: {
    message: {
      type: "string",
      required: true, // Throws an error if this input isn't passed.
      writable: true, // Allows this view to write back to a writable binding.
      // Without 'writable: true', writable bindings will be read-only when passed.
    },
  },

  setup(ctx) {
    const $$message = ctx.inputs.$$("message");

    return (
      <div>
        <p>Message: {$$message}</p>
        <button
          onclick={() => {
            // Writing $$message here updates the original $$message in the superview.
            $$message.set("Hello");
          }}
        >
          Reset State
        </button>
      </div>
    );
  },
});

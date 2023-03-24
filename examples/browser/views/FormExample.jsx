import { View, makeState, joinStates } from "@borf/browser";
import logLifecycle from "../utils/logLifecycle.js";

export class FormExample extends View {
  setup(ctx) {
    const $$firstName = makeState("");
    const $$lastName = makeState("");
    const $$age = makeState(18);

    logLifecycle(ctx);

    const $errors = joinStates(
      $$firstName,
      $$lastName,
      $$age,
      (firstName, lastName, age) => {
        let errors = [];

        if (firstName.trim() === "") {
          errors.push("First name can't be empty.");
        }

        if (lastName.trim() === "") {
          errors.push("Last name can't be empty.");
        }

        if (age < 18) {
          errors.push("You must be 18 or older to view this content. 👀");
        }

        return errors;
      }
    );
    const $hasErrors = $errors.map((e) => e.length > 0);

    ctx.subscribe([$hasErrors, $errors], (hasErrors, errors) => {
      ctx.log("hasErrors?", hasErrors);
      if (hasErrors) {
        ctx.log("errors", errors);
      }
    });

    const onsubmit = (e) => {
      e.preventDefault();
      alert("Thank you for your submission.");
    };

    return (
      <div class="example">
        <h3>Form with validation</h3>
        <form onsubmit={onsubmit}>
          <input type="text" value={$$firstName} placeholder="First Name" />
          <input type="text" value={$$lastName} placeholder="Last Name" />
          <input type="number" value={$$age} placeholder="Age" />

          <button disabled={$hasErrors}>Submit</button>

          {View.when(
            $hasErrors,
            View.repeat($errors, (ctx) => {
              const $error = ctx.inputs.readable("item");
              return <div style="color:red">{$error}</div>;
            })
          )}
        </form>
      </div>
    );
  }
}
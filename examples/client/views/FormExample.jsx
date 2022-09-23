import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const FormExample = makeView((ctx) => {
  ctx.name = "FormExample";
  ctx.defaultState = {
    firstName: "",
    lastName: "",
    age: 18,
  };

  logLifecycle(ctx);

  const $errors = ctx.readable().to((state) => {
    let errors = [];

    if (state.firstName.trim() == "") {
      errors.push("First name can't be empty.");
    }

    if (state.lastName.trim() == "") {
      errors.push("Last name can't be empty.");
    }

    if (state.age < 18) {
      errors.push("You must be 18 or older to window this content. 👀");
    }

    return errors;
  });
  const $hasErrors = $errors.to((e) => e.length > 0);

  ctx.observe($errors, (value) => {
    ctx.log("errors", value);
  });

  ctx.observe($hasErrors, (value) => {
    ctx.log("hasErrors?", value);
  });

  const onsubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your submission.");
  };

  return (
    <div class="example">
      <h3>Form with validation</h3>
      <form onsubmit={onsubmit}>
        <input
          type="text"
          value={ctx.writable("firstName")}
          placeholder="First Name"
        />
        <input
          type="text"
          value={ctx.writable("lastName")}
          placeholder="Last Name"
        />
        <input type="number" value={ctx.writable("age")} placeholder="Age" />

        <button disabled={$hasErrors}>Submit</button>

        {ctx.when(
          $hasErrors,
          ctx.repeat($errors, ($error) => {
            return <div style="color:red">{$error}</div>;
          })
        )}
      </form>
    </div>
  );
});

import { when, repeat } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export function FormExample() {
  this.name = "FormExample";
  this.defaultState = {
    firstName: "",
    lastName: "",
    age: 18,
  };

  logLifecycle(this);

  const $state = this.read();
  const $errors = $state.to((state) => {
    let errors = [];

    if (state.firstName.trim() == "") {
      errors.push("First name can't be empty.");
    }

    if (state.lastName.trim() == "") {
      errors.push("Last name can't be empty.");
    }

    if (state.age < 18) {
      errors.push("You must be 18 or older to view this content. 👀");
    }

    return errors;
  });
  const $hasErrors = $errors.to((e) => e.length > 0);

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
          value={this.readWrite("firstName")}
          placeholder="First Name"
        />
        <input
          type="text"
          value={this.readWrite("lastName")}
          placeholder="Last Name"
        />
        <input type="number" value={this.readWrite("age")} placeholder="Age" />

        <button disabled={$hasErrors}>Submit</button>

        {when($hasErrors, () =>
          repeat($errors, function Error() {
            return <div style="color:red">{this.read("value")}</div>;
          })
        )}
      </form>
    </div>
  );
}

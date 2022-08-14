import { when, repeat, bind, State, mergeStates } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export default function FormExample() {
  this.debug.name = "FormExample";

  logLifecycle(this);

  const $firstName = new State("");
  const $lastName = new State("");
  const $age = new State(18);

  // TODO: Convert to State.merge
  const $errors = mergeStates(
    $firstName,
    $lastName,
    $age,
    (first, last, age) => {
      let errors = [];

      if (first.trim() == "") {
        errors.push("First name can't be empty.");
      }

      if (last.trim() == "") {
        errors.push("Last name can't be empty.");
      }

      if (age < 18) {
        errors.push("You must be 18 or older to view this content. 👀");
      }

      return errors;
    }
  );
  const $hasErrors = $errors.map((current) => current.length > 0);

  function onsubmit(e) {
    e.preventDefault();
    alert("Thank you for your submission.");
  }

  return (
    <div class="example">
      <h3>Form with validation</h3>
      <form onsubmit={onsubmit}>
        <input type="text" value={bind($firstName)} placeholder="First Name" />
        <input type="text" value={bind($lastName)} placeholder="Last Name" />
        <input type="number" value={bind($age)} placeholder="Age" />
        <button disabled={$hasErrors}>Submit</button>
        {when($hasErrors, () =>
          repeat($errors, ({ $attrs }) => {
            const $message = $attrs.map((attrs) => attrs.value);

            return <div style="color:red">{$message}</div>;
          })
        )}
      </form>
    </div>
  );
}

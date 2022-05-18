import { makeComponent, makeState, mergeStates } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

const FormExample = makeComponent(($, self) => {
  self.debug.name = "FormExample";

  logLifecycle(self);

  const $firstName = makeState("");
  const $lastName = makeState("");
  const $age = makeState(18);

  const $errors = mergeStates($firstName, $lastName, $age, (first, last, age) => {
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
  });
  const $hasErrors = $errors.map((current) => current.length > 0);

  function onsubmit(e) {
    e.preventDefault();
    alert("Thank you for your submission.");
  }

  return (
    <div class="example">
      <h3>Form with validation</h3>
      <form onsubmit={onsubmit}>
        <input type="text" value={$.bind($firstName)} placeholder="First Name" />
        <input type="text" value={$.bind($lastName)} placeholder="Last Name" />
        <input type="number" value={$.bind($age)} placeholder="Age" />
        <button disabled={$hasErrors}>Submit</button>
        {$.if($hasErrors, () =>
          $.each($errors, ($, self) => {
            const $message = self.map("@value");

            self.key = $message;

            return <div style="color:red">{$message}</div>;
          })
        )}
      </form>
    </div>
  );
});

export default FormExample;

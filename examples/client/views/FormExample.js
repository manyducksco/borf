import logLifecycle from "../utils/logLifecycle.js";

export function FormExample() {
  this.name = "FormExample";
  this.defaultState = {
    firstName: "",
    lastName: "",
    age: 18,
  };

  logLifecycle(this);

  const $errors = this.merge((state) => {
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

  this.observe($errors, (value) => {
    this.log("errors", value);
  });

  this.observe($hasErrors, (value) => {
    this.log("hasErrors?", value);
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
          value={this.writable("firstName")}
          placeholder="First Name"
        />
        <input
          type="text"
          value={this.writable("lastName")}
          placeholder="Last Name"
        />
        <input type="number" value={this.writable("age")} placeholder="Age" />

        <button disabled={$hasErrors}>Submit</button>

        {this.when(
          $hasErrors,
          this.repeat($errors, function Error() {
            const $value = this.readable("value");
            this.observe($value, (value) => {
              this.log("value", value);
            });

            return <div style="color:red">{$value}</div>;
          })
        )}
      </form>
    </div>
  );
}

import {
  makeComponent,
  repeat,
  bind,
  makeState,
  mergeStates,
} from "@woofjs/client";

const flightTypes = ["one-way flight", "return flight"];

export default makeComponent((ctx) => {
  ctx.debug.name = "7GUIs:FlightBooker";

  const $flightType = makeState(flightTypes[0]);
  const $startDate = makeState(formatDate(new Date()));
  const $returnDate = makeState(formatDate(new Date()));

  const $startDateIsValid = makeState(true);
  const $returnDateIsValid = makeState(true);

  // TODO: Convert to State.merge
  // const $formIsValid = State.merge($startDateIsValid, $returnDateIsValid).into(
  //   (startIsValid, returnIsValid) => {
  //     return startIsValid && returnIsValid;
  //   }
  // );

  const $formIsValid = mergeStates($startDateIsValid, $returnDateIsValid).into(
    (d1, d2) => {
      return d1 && d2;
    }
  );

  function formatDate(date) {
    date = new Date();

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    return `${d}.${m}.${y}`;
  }

  function validateDate(str) {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
      return false;
    }

    return true;
  }

  function parseDate(str) {
    const [d, m, y] = str.split(".").map(Number);

    return new Date(y, m - 1, d);
  }

  return (
    <div class="example">
      <header>
        <h3>Flight Booker</h3>
      </header>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          alert("Flight booked.");
        }}
      >
        <div>
          <select
            onchange={(e) => {
              $flightType.set(e.target.value);
            }}
          >
            {repeat(
              flightTypes,
              function FlightOption() {
                const $value = this.$attrs.map((a) => a.value);
                const $selected = mergeStates($value, $flightType).into(
                  (value, current) => {
                    return value === current;
                  }
                );

                return (
                  <option value={$value} selected={$selected}>
                    {$value}
                  </option>
                );
              },
              (value) => value
            )}
          </select>
        </div>

        <div>
          <input
            type="text"
            value={bind($startDate)}
            pattern={"^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$"}
            oninput={(e) => {
              $startDateIsValid.set(!e.target.validity.patternMismatch);
            }}
          />
        </div>

        <div>
          <input
            type="text"
            value={bind($returnDate)}
            disabled={$flightType.map((t) => t === "one-way flight")}
            pattern={/^\d{2}\.\d{2}\.\d{4}$/}
            oninput={(e) => {
              $returnDateIsValid.set(!e.target.validity.patternMismatch);
            }}
          />
        </div>

        <div>
          <button disabled={$formIsValid.map((valid) => !valid)}>Book</button>
        </div>
      </form>
    </div>
  );
});

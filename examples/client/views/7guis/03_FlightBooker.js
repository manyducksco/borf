import { makeView } from "@woofjs/client";

const flightTypes = ["one-way flight", "return flight"];
const flipped = (value) => !value; // Boolean flipping function.

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

export default makeView((ctx) => {
  ctx.name = "7guis:FlightBooker";
  ctx.defaultState = {
    flightType: flightTypes[0],
    startDate: formatDate(new Date()),
    returnDate: formatDate(new Date()),
    startDateIsValid: true,
    returnDateIsValid: true,
  };

  const $$flightType = ctx.state(flightTypes[0]);
  const $$startDate = ctx.state(formatDate(new Date()));
  const $$returnDate = ctx.state(formatDate(new Date()));
  const $$startDateIsValid = ctx.state(true);
  const $$returnDateIsValid = ctx.state(true);

  // Concatenate date states and convert through a function into a new state.
  const $formIsValid = ctx.merge(
    $$startDateIsValid,
    $$returnDateIsValid,
    (x, y) => x && y
  );

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
              $$flightType.set(e.target.value);
            }}
          >
            {ctx.repeat(flightTypes, ($value) => {
              const $selected = ctx.merge(
                $value,
                $$flightType,
                (x, y) => x === y
              );

              return (
                <option value={$value} selected={$selected}>
                  {$value}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <input
            type="text"
            value={$$startDate}
            pattern={"^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$"}
            oninput={(e) => {
              $$startDateIsValid.set(!e.target.validity.patternMismatch);
            }}
          />
        </div>

        <div>
          <input
            type="text"
            value={$$returnDate}
            disabled={$$flightType.to((t) => t === "one-way flight")}
            pattern={/^\d{2}\.\d{2}\.\d{4}$/}
            oninput={(e) => {
              $$returnDateIsValid.set(!e.target.validity.patternMismatch);
            }}
          />
        </div>

        <div>
          <button disabled={$formIsValid.as(flipped)}>Book</button>
        </div>
      </form>
    </div>
  );
});

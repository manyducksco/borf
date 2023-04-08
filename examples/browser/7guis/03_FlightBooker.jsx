import { Writable, Readable, View } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

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

class FlightBooker extends View {
  static label = "7guis:FlightBooker";

  setup(ctx, m) {
    const $$flightType = new Writable(flightTypes[0]);
    const $$startDate = new Writable(formatDate(new Date()));
    const $$returnDate = new Writable(formatDate(new Date()));
    const $$startDateIsValid = new Writable(true);
    const $$returnDateIsValid = new Writable(true);

    // Concatenate date states and convert through a function into a new state.
    const $formIsValid = Readable.merge(
      [$$startDateIsValid, $$returnDateIsValid],
      (x, y) => x && y
    );

    return (
      <ExampleFrame title="3. Flight Booker">
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
              {View.forEach(new Readable(flightTypes), (ctx) => {
                const $value = ctx.inputs.$("value");

                const $selected = Readable.merge(
                  [$value, $$flightType],
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
              disabled={$$flightType.map((t) => t === "one-way flight")}
              pattern={/^\d{2}\.\d{2}\.\d{4}$/}
              oninput={(e) => {
                $$returnDateIsValid.set(!e.target.validity.patternMismatch);
              }}
            />
          </div>

          <div>
            <button disabled={$formIsValid.map(flipped)}>Book</button>
          </div>
        </form>
      </ExampleFrame>
    );
  }
}

export default FlightBooker;

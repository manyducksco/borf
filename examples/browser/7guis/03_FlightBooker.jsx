import { Writable, Readable, m } from "@borf/browser";
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

export default function (self) {
  self.setName("7GUIs:FlightBooker");

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

  return m(ExampleFrame, { title: "3. Flight Booker" }, [
    m.form(
      {
        onsubmit: (e) => {
          e.preventDefault();
          alert("Flight booked.");
        },
      },

      m.div(
        m.select(
          {
            onchange: (e) => {
              $$flightType.set(e.target.value);
            },
          },
          m.$repeat(new Readable(flightTypes), ($type) => {
            const $selected = Readable.merge(
              [$type, $$flightType],
              (x, y) => x === y
            );

            return m.option({ value: $type, selected: $selected }, $type);
          })
        )
      ),

      m.div(
        m.input({
          type: "text",
          value: $$startDate,
          pattern: "^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$",
          oninput: (e) => {
            $$startDateIsValid.set(!e.target.validity.patternMismatch);
          },
        })
      ),

      m.div(
        m.input({
          type: "text",
          value: $$returnDate,
          disabled: $$flightType.map((t) => t === "one-way flight"),
          pattern: /^\d{2}\.\d{2}\.\d{4}$/,
          oninput: (e) => {
            $$returnDateIsValid.set(!e.target.validity.patternMismatch);
          },
        })
      ),

      m.div(m.button({ disabled: $formIsValid.map(flipped) }, "Book"))
    ),
  ]);
}

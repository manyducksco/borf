import { repeat } from "@woofjs/client";

const flightTypes = ["one-way flight", "return flight"];
const flipped = (value) => !value; // Boolean flipping function.

export default function FlightBooker() {
  this.name = "7guis:FlightBooker";
  this.defaultState = {
    flightType: flightTypes[0],
    startDate: formatDate(new Date()),
    returnDate: formatDate(new Date()),
    startDateIsValid: true,
    returnDateIsValid: true,
  };

  const formatDate = (date) => {
    date = new Date();

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    return `${d}.${m}.${y}`;
  };

  const validateDate = (str) => {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
      return false;
    }

    return true;
  };

  const parseDate = (str) => {
    const [d, m, y] = str.split(".").map(Number);

    return new Date(y, m - 1, d);
  };

  const $$flightType = this.readWrite("flightType");
  const $$startDate = this.readWrite("startDate");
  const $$returnDate = this.readWrite("returnDate");

  // Concatenate date states and convert through a function into a new state.
  const $formIsValid = this.concat("startDateIsValid", "returnDateIsValid").to(
    ([d1, d2]) => {
      return d1 && d2;
    }
  );

  // is("this").javascriptCase?.it.is("English").dressed["up"][2].lookLike("JavaScript").code
  // I.should["_make"].a.textConverter("for", this).

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
            {repeat(flightTypes, function FlightType() {
              const $value = this.read("value");
              const $selected = this.concat($value, $$flightType).to(
                ([value, current]) => {
                  return value === current;
                }
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
              this.set("startDateIsValid", !e.target.validity.patternMismatch);
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
              this.set("returnDateIsValid", !e.target.validity.patternMismatch);
            }}
          />
        </div>

        <div>
          <button disabled={$formIsValid.to(flipped)}>Book</button>
        </div>
      </form>
    </div>
  );
}

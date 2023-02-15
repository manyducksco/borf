import { State, View } from "woofe";
import { ExampleFrame } from "../views/ExampleFrame";

class TempConverter extends View {
  static label = "7guis:TempConverter";

  setup(ctx) {
    const $$celsius = new State(10);

    const setCelsius = (c) => {
      $$celsius.set(c);
    };

    const setFahrenheit = (f) => {
      $$celsius.set((f - 32) * (5 / 9));
    };

    const $celsius = $$celsius.readable();
    const $fahrenheit = $celsius.as((c) => c * (9 / 5) + 32);

    return (
      <ExampleFrame title="2. Temperature Converter">
        <input
          type="text"
          value={$celsius}
          oninput={(e) => {
            const value = Number(e.target.value);
            setCelsius(value);
          }}
        />
        Celsius =
        <input
          type="text"
          value={$fahrenheit}
          oninput={(e) => {
            const value = Number(e.target.value);
            setFahrenheit(value);
          }}
        />
        Fahrenheit
      </ExampleFrame>
    );
  }
}

export default TempConverter;

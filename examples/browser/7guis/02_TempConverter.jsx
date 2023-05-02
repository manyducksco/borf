import { Writable, useName } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function () {
  useName("7GUIs:TempConverter");

  const $$celsius = new Writable(10);

  const setCelsius = (c) => {
    $$celsius.set(c);
  };

  const setFahrenheit = (f) => {
    $$celsius.set((f - 32) * (5 / 9));
  };

  const $celsius = $$celsius.toReadable();
  const $fahrenheit = $celsius.map((c) => c * (9 / 5) + 32);

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

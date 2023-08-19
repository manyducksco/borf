import { readable, writable, computed } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (_, c) {
  c.name = "7GUIs:TempConverter";

  const $$celsius = writable(10);

  const setCelsius = (c) => {
    $$celsius.set(c);
  };

  const setFahrenheit = (f) => {
    $$celsius.set((f - 32) * (5 / 9));
  };

  const $celsius = readable($$celsius);
  const $fahrenheit = computed($celsius, (c) => c * (9 / 5) + 32);

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

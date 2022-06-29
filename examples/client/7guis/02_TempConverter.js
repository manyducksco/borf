import { makeState } from "@woofjs/client";

export default function TempConverter($attrs, self) {
  self.debug.name = "7GUIs:TempConverter";

  const $celsius = makeState(10);
  const $fahrenheit = $celsius.map((c) => c * (9 / 5) + 32);

  function setFahrenheit(f) {
    $celsius.set((f - 32) * (5 / 9));
  }

  function setCelsius(c) {
    $celsius.set(c);
  }

  return (
    <div class="example">
      <header>
        <h3>Temperator Converter</h3>
      </header>
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
    </div>
  );
}

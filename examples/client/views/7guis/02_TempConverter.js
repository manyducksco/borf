import { makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:TempConverter";

  const $$celsius = ctx.state(10);

  const setCelsius = (c) => {
    $$celsius.set(c);
  };

  const setFahrenheit = (f) => {
    $$celsius.set((f - 32) * (5 / 9));
  };

  const $celsius = $$celsius.readable();
  const $fahrenheit = $celsius.as((c) => c * (9 / 5) + 32);

  return (
    <div class="example">
      <header>
        <h3>Temperature Converter</h3>
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
});

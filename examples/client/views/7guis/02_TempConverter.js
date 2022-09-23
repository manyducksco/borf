import { makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:TempConverter";
  ctx.defaultState = {
    celsius: 10,
  };

  const setCelsius = (c) => {
    ctx.set("celsius", c);
  };

  const setFahrenheit = (f) => {
    ctx.set("celsius", (f - 32) * (5 / 9));
  };

  const $celsius = ctx.readable("celsius");
  const $fahrenheit = $celsius.to((c) => c * (9 / 5) + 32);

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

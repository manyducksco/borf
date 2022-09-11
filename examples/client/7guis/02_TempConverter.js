export default function TempConverter() {
  this.debug.name = "7guis:TempConverter";
  this.defaultState = {
    celsius: 10,
  };

  const setFahrenheit = (f) => {
    this.set("celsius", (f - 32) * (5 / 9));
  };

  const setCelsius = (c) => {
    this.set("celsius", c);
  };

  const $celsius = this.read("celsius");
  const $fahrenheit = $celsius.to((c) => c * (9 / 5) + 32);

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

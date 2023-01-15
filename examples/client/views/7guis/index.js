import { makeView } from "woofe";

export default makeView((ctx) => {
  return (
    <div>
      <p>
        This is an implementation of{" "}
        <a href="https://eugenkiss.github.io/7guis/">7GUIs</a>, a system for
        evaluating UI frameworks.
      </p>

      <ul>
        <li>
          <a href="/7guis/counter">Counter</a>
        </li>
        <li>
          <a href="/7guis/temp-converter">Temperature Converter</a>
        </li>
        <li>
          <a href="/7guis/flight-booker">Flight Booker</a>
        </li>
        <li>
          <a href="/7guis/timer">Timer</a>
        </li>
        <li>
          <a href="/7guis/crud">CRUD</a>
        </li>
        <li>
          <a href="/7guis/circle-drawer">Circle Drawer</a>
        </li>
        <li>
          <a href="/7guis/cells">Cells</a>
        </li>
      </ul>

      <div>{ctx.outlet()}</div>
    </div>
  );
});

import { makeComponent } from "@woofjs/client";

import Counter from "./01_Counter";
import TempConverter from "./02_TempConverter";
import FlightBooker from "./03_FlightBooker";
import Timer from "./04_Timer";
import CRUD from "./05_CRUD";
import CircleDrawer from "./06_CircleDrawer";
import Cells from "./07_Cells";

export default makeComponent(($, self) => {
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

      <div>
        {$.router((self) => {
          self.route("counter", Counter);
          self.route("temp-converter", TempConverter);
          self.route("flight-booker", FlightBooker);
          self.route("timer", Timer);
          self.route("crud", CRUD);
          self.route("circle-drawer", CircleDrawer);
          self.route("cells", Cells);

          self.redirect("*", "./counter");
        })}
      </div>
    </div>
  );
});

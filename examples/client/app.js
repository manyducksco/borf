import "./styles/demo.css";

import woof from "@woofjs/client";

import counter from "./globals/counter.js";
import mouse from "./globals/mouse.js";

import { AppLayout } from "./views/AppLayout";
import { ComponentAttrsExample } from "./views/ComponentAttrsExample.js";
import { ToggleExample } from "./views/ToggleExample.js";
import { CounterExample } from "./views/CounterExample.js";
import { ConditionalExample } from "./views/ConditionalExample.js";
import { DynamicListExample } from "./views/DynamicListExample.js";
import { TwoWayBindExample } from "./views/TwoWayBindExample.js";
import { FormExample } from "./views/FormExample.js";
import { MouseFollowerExample } from "./views/MouseFollowerExample.js";
import { HTTPRequestExample } from "./views/HTTPRequestExample.js";

import SevenGUIs from "./7guis";
import Counter from "./7guis/01_Counter";
import TempConverter from "./7guis/02_TempConverter";
import FlightBooker from "./7guis/03_FlightBooker";
import Timer from "./7guis/04_Timer";
import CRUD from "./7guis/05_CRUD";
import CircleDrawer from "./7guis/06_CircleDrawer";
import Cells from "./7guis/07_Cells";

// const timer = new EventSource("/timer");

// timer.addEventListener("time", (event) => {
//   console.log("time:", event.data + " seconds remaining");
// });

// timer.addEventListener("message", (event) => {
//   console.log("message:", event.data);
// });

const app = woof({
  debug: {
    filter: "*",
    log: true,
    warn: true,
    error: true,
  },
  router: {
    hash: false,
  },
});

app.global("counter", counter);
app.global("mouse", mouse);

app.route("/client-test", function () {
  return <h1>Test</h1>;
});

app.route("*", AppLayout, function () {
  this.route("/examples", () => {
    return (
      <div>
        <ToggleExample />
        <CounterExample />
        <ConditionalExample />
        <DynamicListExample />
        <TwoWayBindExample />
        <FormExample />
        <MouseFollowerExample />
        <HTTPRequestExample />
        <ComponentAttrsExample />
      </div>
    );
  });

  this.route("/7guis", SevenGUIs, function () {
    this.route("/counter", Counter);
    this.route("/temp-converter", TempConverter);
    this.route("/flight-booker", FlightBooker);
    this.route("/timer", Timer);
    this.route("/crud", CRUD);
    this.route("/circle-drawer", CircleDrawer);
    this.route("/cells", Cells);
    this.redirect("*", "./counter");
  });

  this.route("/router-test/one", function () {
    return <h1>One</h1>;
  });

  this.route("/router-test/two", function () {
    return <h1>Two</h1>;
  });

  this.redirect("/router-test/*", "/router-test/one");

  this.route(
    "/nested",
    function Nested() {
      return (
        <div>
          <h1>Nested Routes!</h1>

          {this.outlet()}
        </div>
      );
    },
    function subroutes() {
      this.route("/one", function () {
        return <h1>NESTED #1</h1>;
      });
      this.route("/two", function () {
        return <h1>NESTED #2</h1>;
      });
      this.redirect("*", "./one");
    }
  );

  this.redirect("*", "./examples");
});

app.connect("#app");

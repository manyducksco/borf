import "./styles/demo.css";

import { makeApp } from "@woofjs/client";

import CounterService from "./services/CounterService.js";
import MouseService from "./services/MouseService.js";

import AppLayout from "./components/AppLayout";
import ComponentAttrsExample from "./components/ComponentAttrsExample.js";
import ToggleExample from "./components/ToggleExample.js";
import CounterExample from "./components/CounterExample.js";
import ConditionalExample from "./components/ConditionalExample.js";
import DynamicListExample from "./components/DynamicListExample.js";
import TwoWayBindExample from "./components/TwoWayBindExample.js";
import FormExample from "./components/FormExample.js";
import MouseFollowerExample from "./components/MouseFollowerExample.js";
import HTTPRequestExample from "./components/HTTPRequestExample.js";

import Counter from "./7guis/01_Counter";
import TempConverter from "./7guis/02_TempConverter";
import FlightBooker from "./7guis/03_FlightBooker";
import Timer from "./7guis/04_Timer";
import CRUD from "./7guis/05_CRUD";
import CircleDrawer from "./7guis/06_CircleDrawer";
import Cells from "./7guis/07_Cells";

import SevenGUIs from "./7guis";

import logLifecycle from "./utils/logLifecycle";

const app = makeApp({
  hash: true,
  debug: {
    filter: "*",
    log: true,
    warn: true,
    error: true,
  },
});

app.service("counter", CounterService);
app.service("mouse", MouseService);

app.route("*", AppLayout, function () {
  this.route("/examples", ($) => {
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

  this.route("/router-test/one", ($attrs, self) => {
    return <h1>One</h1>;
  });

  this.route("/router-test/two", ($attrs, self) => {
    return <h1>Two</h1>;
  });

  this.redirect("/router-test/*", "/router-test/one");

  this.route(
    "/nested",
    ($, self) => (
      <div>
        <h1>Nested Routes!</h1>

        {self.children}
      </div>
    ),
    function () {
      this.route("/one", ($) => <h1>NESTED #1</h1>);
      this.route("/two", ($) => <h1>NESTED #2</h1>);
      this.redirect("*", "./one");
    }
  );

  this.redirect("*", "./examples");
});

app.connect("#app");

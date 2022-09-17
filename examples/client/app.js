import "./styles/demo.css";

import woof from "@woofjs/client";

import counter from "./globals/counter";
import mouse from "./globals/mouse";

import { AppLayout } from "./views/AppLayout";
import { ComponentAttrsExample } from "./views/ComponentAttrsExample";
import { ToggleExample } from "./views/ToggleExample";
import { CounterExample } from "./views/CounterExample";
import { ConditionalExample } from "./views/ConditionalExample";
import { DynamicListExample } from "./views/DynamicListExample";
import { TwoWayBindExample } from "./views/TwoWayBindExample";
import { FormExample } from "./views/FormExample";
import { MouseFollowerExample } from "./views/MouseFollowerExample";
import { HTTPRequestExample } from "./views/HTTPRequestExample";

import SevenGUIs from "./views/7guis";
import Counter from "./views/7guis/01_Counter";
import TempConverter from "./views/7guis/02_TempConverter";
import FlightBooker from "./views/7guis/03_FlightBooker";
import Timer from "./views/7guis/04_Timer";
import CRUD from "./views/7guis/05_CRUD";
import CircleDrawer from "./views/7guis/06_CircleDrawer";
import Cells from "./views/7guis/07_Cells";

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

// Make separate modules with their own globals and routes. Modules can be mounted on any route.
// Modules do have access to app-level globals, though ones of the same name on their module will override.
// const mod = makeModule();

// mod.global("counter", counter);
// mod.route("/test", function () {
//   return <div>Welcome to a module.</div>;
// });

// app.route("/module", mod);

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
    (ctx) => {
      return (
        <div>
          <h1>Nested Routes!</h1>

          {ctx.outlet()}
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

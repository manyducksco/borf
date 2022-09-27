import "./styles/demo.css";

import { makeApp } from "@woofjs/client";

import counter from "./globals/counter";
import mouse from "./globals/mouse";

import { AppLayout, preloadAppLayout } from "./views/AppLayout";
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
//
// timer.addEventListener("time", (event) => {
//   console.log("time:", event.data + " seconds remaining");
// });
//
// timer.addEventListener("message", (event) => {
//   console.log("message:", event.data);
// });

const app = makeApp({
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

app.route("*", {
  view: AppLayout,
  preload: preloadAppLayout,
  subroutes: function (sub) {
    sub.route("/examples", function () {
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

    sub.route("/7guis", SevenGUIs, function (sub) {
      sub.route("/counter", Counter);
      sub.route("/temp-converter", TempConverter);
      sub.route("/flight-booker", FlightBooker);
      sub.route("/timer", Timer);
      sub.route("/crud", CRUD);
      sub.route("/circle-drawer", CircleDrawer);
      sub.route("/cells", Cells);
      sub.redirect("*", "./counter");
    });

    sub.route("/router-test/one", function () {
      return <h1>One</h1>;
    });

    sub.route("/router-test/two", function () {
      return <h1>Two</h1>;
    });

    sub.redirect("/router-test/*", "/router-test/one");

    sub.route("/nested", {
      view: function (ctx) {
        return (
          <div>
            <h1>Nested Routes!</h1>

            {ctx.outlet()}
          </div>
        );
      },
      subroutes: function (sub) {
        sub.route("/one", function () {
          return <h1>NESTED #1</h1>;
        });
        sub.route("/two", function () {
          return <h1>NESTED #2</h1>;
        });
        sub.redirect("*", "./one");
      },
    });

    sub.redirect("*", "./examples");
  },
});

app.connect("#app");

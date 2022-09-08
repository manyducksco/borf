import "./styles/demo.css";

import { makeComponent, makeApp, makeState } from "@woofjs/client";

import CounterService from "./services/CounterService.js";
import MouseService from "./services/MouseService.js";

import { prop } from "ramda";

import { AppLayout } from "./components/AppLayout";
import { ComponentAttrsExample } from "./components/ComponentAttrsExample.js";
import { ToggleExample } from "./components/ToggleExample.js";
import { CounterExample } from "./components/CounterExample.js";
import { ConditionalExample } from "./components/ConditionalExample.js";
import { DynamicListExample } from "./components/DynamicListExample.js";
import { TwoWayBindExample } from "./components/TwoWayBindExample.js";
import { FormExample } from "./components/FormExample.js";
import { MouseFollowerExample } from "./components/MouseFollowerExample.js";
import { HTTPRequestExample } from "./components/HTTPRequestExample.js";

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

/**
 * Component for testing transitionOut hook.
 */
const TransitionPage = makeComponent((ctx) => {
  ctx.debug.name = "TransitionPage";

  const $ref = makeState();
  const $classes = makeState({
    transitionPage: true,
  });

  ctx.afterConnect(() => {
    $classes.set((classes) => {
      classes.enter = true;
      classes.exit = false;
    });
  });

  ctx.transitionOut(() => {
    ctx.debug.log("transitionOut");

    $classes.set((classes) => {
      classes.enter = false;
      classes.exit = true;
    });

    return new Promise((resolve) => {
      $ref.get().addEventListener("transitionend", () => {
        resolve();
      });
    });
  });

  return (
    <div $ref={$ref} class={$classes}>
      {ctx.$attrs.map(prop("label"))}
    </div>
  );
});

export const app = makeApp({
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

app.service("counter", CounterService);
app.service("mouse", MouseService);

app.route("*", AppLayout, (sub) => {
  sub.route("/examples", () => {
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

  sub.route(
    "/transitions",
    (ctx) => {
      return (
        <div>
          <ul>
            <li>
              <a href="/transitions/one">One</a>
            </li>
            <li>
              <a href="/transitions/two">Two</a>
            </li>
            <li>
              <a href="/transitions/three">Three</a>
            </li>
          </ul>
          <div>{ctx.children}</div>
        </div>
      );
    },
    function (sub) {
      sub.route("/one", <TransitionPage label="One" />);
      sub.route("/two", <TransitionPage label="Two" />);
      sub.route("/three", <TransitionPage label="Three" />);
      sub.redirect("*", "./one");
    }
  );

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

  sub.route("/router-test/one", () => {
    return <h1>One</h1>;
  });

  sub.route("/router-test/two", () => {
    return <h1>Two</h1>;
  });

  sub.redirect("/router-test/*", "/router-test/one");

  sub.route(
    "/nested",
    function (ctx) {
      return (
        <div>
          <h1>Nested Routes!</h1>

          {ctx.children}
        </div>
      );
    },
    function (sub) {
      sub.route("/one", () => <h1>NESTED #1</h1>);
      sub.route("/two", () => <h1>NESTED #2</h1>);
      sub.redirect("*", "./one");
    }
  );

  sub.redirect("*", "./examples");
});

app.connect("#app");

import "./styles/demo.css";

import { App, makeState } from "@woofjs/client";

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

const app = new App({
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

  this.route(
    "/transitions",
    function () {
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
          <div>{this.children}</div>
        </div>
      );
    },
    function () {
      const TransitionPage = function () {
        this.debug.name = "TransitionPage";

        const $ref = makeState();
        const $classes = makeState({
          transitionPage: true,
        });

        this.afterConnect(() => {
          $classes.set((classes) => {
            classes.enter = true;
            classes.exit = false;
          });
        });

        this.transitionOut(() => {
          this.debug.log("transitionOut");

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
            {this.$attrs.map("label")}
          </div>
        );
      };

      this.route("/one", <TransitionPage label="One" />);
      this.route("/two", <TransitionPage label="Two" />);
      this.route("/three", <TransitionPage label="Three" />);
      this.redirect("*", "./one");
    }
  );

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

  this.route("/router-test/one", () => {
    return <h1>One</h1>;
  });

  this.route("/router-test/two", () => {
    return <h1>Two</h1>;
  });

  this.redirect("/router-test/*", "/router-test/one");

  this.route(
    "/nested",
    function () {
      return (
        <div>
          <h1>Nested Routes!</h1>

          {this.children}
        </div>
      );
    },
    function () {
      this.route("/one", () => <h1>NESTED #1</h1>);
      this.route("/two", () => <h1>NESTED #2</h1>);
      this.redirect("*", "./one");
    }
  );

  this.redirect("*", "./examples");
});

app.connect("#app");

import "./styles/demo.css";

import { makeApp } from "woofe";

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
import { SpringExample } from "./views/SpringExample";
import { LocalsExample } from "./views/LocalsExample";

import { RenderOrderTest } from "./views/RenderOrderTest.jsx";

import SevenGUIs from "./views/7guis";
import Counter from "./views/7guis/01_Counter";
import TempConverter from "./views/7guis/02_TempConverter";
import FlightBooker from "./views/7guis/03_FlightBooker";
import Timer from "./views/7guis/04_Timer";
import CRUD from "./views/7guis/05_CRUD";
import CircleDrawer from "./views/7guis/06_CircleDrawer";
import Cells from "./views/7guis/07_Cells";

const timer = new EventSource("/timer");

timer.addEventListener("time", (event) => {
  console.log("time:", event.data + " seconds remaining");
});

timer.addEventListener("message", (event) => {
  console.log("message:", event.data);
});

const Examples = makeApp({
  debug: {
    filter: "*",
    log: true,
    warn: true,
    error: true,
  },
  router: {
    hash: false,
  },
  globals: [
    { name: "counter", global: counter },
    { name: "mouse", global: mouse },
  ],
  view: AppLayout,
  routes: [
    // Routes are always rendered in the outlet of the sibling view.
    {
      path: "/examples",
      view: () => {
        return (
          <div>
            {/* <LocalsExample /> */}
            <SpringExample />
            <ToggleExample />
            <CounterExample />
            {/* {<ConditionalExample />} */}
            <DynamicListExample />
            <TwoWayBindExample />
            {/* <FormExample /> */}
            <MouseFollowerExample />
            {/* <HTTPRequestExample /> */}
            {/* <ComponentAttrsExample /> */}
            {/* <RenderOrderTest /> */}
          </div>
        );
      },
    },
    {
      path: "/7guis",
      view: SevenGUIs,
      routes: [
        { path: "/counter", view: Counter },
        { path: "/temp-converter", view: TempConverter },
        { path: "/flight-booker", view: FlightBooker },
        { path: "/timer", view: Timer },
        { path: "/crud", view: CRUD },
        { path: "/circle-drawer", view: CircleDrawer },
        { path: "/cells", view: Cells },
        { path: "*", redirect: "./counter" },
      ],
    },
    {
      path: "/router-test/one",
      view: {
        name: "Inline View Config",
        setup: () => <h1>One</h1>,
      },
    },
    { path: "/router-test/two", view: () => <h1>Two</h1> },
    { path: "/router-test/*", redirect: "/router-test/one" },
    {
      path: "/nested",
      view: (ctx) => {
        return (
          <div>
            <h1>Nested Routes!</h1>
            {ctx.outlet()}
          </div>
        );
      },
      routes: [
        { path: "/one", view: () => <h1>NESTED #1</h1> },
        { path: "/two", view: () => <h1>NESTED #2</h1> },
        { path: "*", redirect: "./one" },
      ],
    },
    { path: "*", redirect: "./examples" },
  ],
});

console.log(Examples.routes); // Metadata about route configuration
console.log(Examples.globals); // Metadata about registered services

Examples.connect("#app");

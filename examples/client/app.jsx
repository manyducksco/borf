import { App, View, Store } from "woofe";

import { defineElement, defineStore } from "woofe/web-components";

class WebComponentStore extends Store {
  static inputs = {
    initialValue: {},
  };

  setup(ctx) {
    return {
      value: ctx.inputs.get("initialValue"),
    };
  }
}

class WebComponentView extends View {
  static inputs = {
    location: {
      type: "string",
      about: "A string to indicate where this instance is being rendered.",
    },
  };

  setup(ctx) {
    const { location } = ctx.inputs.get();

    const store = ctx.useStore(WebComponentStore);
    const http = ctx.useStore("http");
    // ctx.log({ store, http });

    return <h1>This is a web component. [location:{location}]</h1>;
  }
}

defineStore({
  store: WebComponentStore,
  inputs: { initialValue: "test" },
});
defineElement("web-component-view", WebComponentView);

import { CounterStore } from "./globals/CounterStore";
import { MouseStore } from "./globals/MouseStore";

import { AppLayout } from "./views/AppLayout";

import { CounterWithStore } from "./examples/CounterWithStore";
import { CrashHandling } from "./examples/CrashHandling";
import { Languages } from "./examples/Languages";
import { LocalStores } from "./examples/LocalStores";
import { SpringAnimation } from "./examples/SpringAnimation";

import { RenderOrderTest } from "./views/RenderOrderTest.jsx";

import SevenGUIs from "./7guis";
import Counter from "./7guis/01_Counter";
import TempConverter from "./7guis/02_TempConverter";
import FlightBooker from "./7guis/03_FlightBooker";
import Timer from "./7guis/04_Timer";
import CRUD from "./7guis/05_CRUD";
import CircleDrawer from "./7guis/06_CircleDrawer";
import Cells from "./7guis/07_Cells";

const timer = new EventSource("/timer");

timer.addEventListener("time", (event) => {
  console.log("time:", event.data + " seconds remaining");
});

timer.addEventListener("message", (event) => {
  console.log("message:", event.data);
});

const Examples = new App({
  debug: {
    filter: "*",
    log: true,
    warn: true,
    error: true,
  },
  stores: [CounterStore, MouseStore],
  view: AppLayout,
  routes: [
    {
      path: "/examples",
      routes: [
        { path: "/spring-animation", view: SpringAnimation },
        { path: "/languages", view: Languages },
        { path: "/crash-handling", view: CrashHandling },
        { path: "/counter-with-store", view: CounterWithStore },
        { path: "/local-stores", view: LocalStores },
        { path: "*", redirect: "./spring-animation" },
      ],
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
      view: () => <h1>One</h1>,
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
    {
      path: "/tests",
      routes: [{ path: "/render-order", view: RenderOrderTest }],
    },
    { path: "*", redirect: "./examples" },
  ],
  language: {
    supported: ["en-US", "en-GB", "ja"],
    default: "en-US",
    translations: {
      "en-US": {
        greeting: "Hey",
      },
      "en-GB": {
        greeting: "Greetings",
      },
      ja: {
        greeting: "ようこそ",
      },
    },
  },
});

// console.log(Examples.routes); // Metadata about route configuration

Examples.connect("#app");

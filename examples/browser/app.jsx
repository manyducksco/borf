import { Type } from "@borf/bedrock";
import { App, View, Store, ElementHub } from "@borf/browser";

const WebComponentStore = Store.define({
  inputs: {
    initialValue: {
      // TODO: Inputs with default values should be inferred as optional.
      default: "default",

      // TODO: Inputs with 'optional: true' should be inferred as optional when passing.
    },
  },

  setup(ctx) {
    return {
      value: ctx.inputs.get("initialValue"),
      speak: () => {
        console.log("the value is", value);
      },
    };
  },
});

const WebComponentView = View.define({
  inputs: {
    location: {
      default: "nowhere",
      about: "A string to indicate where this instance is being rendered.",
      assert: Type.assertString,
    },
  },

  setup(ctx) {
    const { location } = ctx.inputs.get();

    const store = ctx.useStore(WebComponentStore);
    const http = ctx.useStore("http");
    // ctx.log({ store, http });

    return <h1>This is a web component. [location:{location}]</h1>;
  },
});

const hub = new ElementHub();

hub.addStore(WebComponentStore, {
  inputs: { initialValue: "test" },
});

hub.addElement("web-component-view", WebComponentView);

hub.connect();

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

const app = new App({
  debug: {
    filter: "*",
    log: true,
    warn: true,
    error: true,
  },
});

app
  .addLanguage("en-US", {
    translation: {
      greeting: "Sup",
    },
  })
  .addLanguage("en-GB", {
    // Use an async function to fetch translations from a server.
    translation: async () => {
      return Promise.resolve({
        greeting: "Well met, traveller",
      });
    },
  })
  .addLanguage("ja", {
    // Or pass a string which is assumed to be a path to a JSON file to be requested over HTTP?
    translation: "/api/lang/ja.json",
  })
  .setLanguage("en-US")
  .setLanguage("auto", { fallback: "en-US" })
  .addStore(CounterStore)
  .addStore(MouseStore)
  .addRootView(AppLayout)
  .addRoute("/examples", null, (sub) => {
    sub
      .addRoute("/spring-animation", SpringAnimation)
      .addRoute("/languages", Languages)
      .addRoute("/crash-handling", CrashHandling)
      .addRoute("/counter-with-store", CounterWithStore)
      .addRoute("/local-stores", LocalStores)
      .addRedirect("*", "./spring-animation");
  })
  .addRoute("/7guis", SevenGUIs, (sub) => {
    sub
      .addRoute("/counter", Counter)
      .addRoute("/temp-converter", TempConverter)
      .addRoute("/flight-booker", FlightBooker)
      .addRoute("/timer", Timer)
      .addRoute("/crud", CRUD)
      .addRoute("/circle-drawer", CircleDrawer)
      .addRoute("/cells", Cells)
      .addRedirect("*", "./counter");
  })
  .addRoute("/router-test/one", () => <h1>One</h1>)
  .addRoute("/router-test/two", () => <h1>Two</h1>)
  .addRedirect("/router-test/*", "/router-test/one")
  .addRoute(
    "/nested",
    function view(ctx) {
      return (
        <div>
          <h1>Nested Routes!</h1>
          {ctx.outlet()}
        </div>
      );
    },
    function extend(sub) {
      sub
        .addRoute("/one", () => <h1>NESTED #1</h1>)
        .addRoute("/two", () => <h1>NESTED #2</h1>)
        .addRedirect("*", "./one");
    }
  )
  .addRoute("/tests", null, (sub) => {
    sub.addRoute("/render-order", RenderOrderTest);
  })
  .addRedirect("*", "./examples");

app.connect("#app");
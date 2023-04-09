import { Type } from "@borf/bedrock";
import { App, View, ElementHub } from "@borf/browser";

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

/*===========================*\
||      Custom Elements      ||
\*===========================*/

// Views and stores can be added to an ElementHub to use them as custom HTML elements.
// This is a good option if you want to sprinkle in views to enhance a regular HTML & CSS website.

const WebComponentView = new View({
  inputs: {
    location: {
      default: "nowhere",
      about: "A string to indicate where this instance is being rendered.",
      assert: Type.assertString,
    },
  },

  setup(ctx) {
    const { location } = ctx.inputs.get();

    return <h1>This is a web component. [location:{location}]</h1>;
  },
});

const hub = new ElementHub();

hub.addElement("web-component-view", WebComponentView);

hub.connect(); // Now using <web-component-view> anywhere in your HTML will create an instance of WebComponentView.

/*===========================*\
||            App            ||
\*===========================*/

// An App is a full-fledged web app, complete with routing and language support.
// This is a good option if you're starting from scratch and are going to need complex logic and multiple pages.

const app = new App({
  debug: {
    filter: "*",
    log: true,
    warn: true,
    error: true,
  },
  mode: import.meta.env.MODE,
});

// ----- Language Support ----- //

app.addLanguage("en-US", {
  translation: {
    greeting: "Howdy pardner",
  },
});

app.addLanguage("en-GB", {
  // Use an async function to fetch translations from a server.
  translation: async () => {
    return Promise.resolve({
      greeting: "Oi guv'nah",
    });
  },
});

app.addLanguage("ja", {
  // Or pass a string which is assumed to be a path to a JSON file to be requested over HTTP?
  translation: "/api/lang/ja.json",
});

// Auto-detect language, falling back to en-US if no appropriate match is found.
app.setLanguage("auto", "en-US");

// ----- Stores ----- //

app.addStore(CounterStore);
app.addStore(MouseStore);

// ----- Root View & Routing ----- //

app.setRootView(AppLayout);

app.addRoute("/examples", null, (sub) => {
  sub.addRoute("/spring-animation", SpringAnimation);
  sub.addRoute("/languages", Languages);
  sub.addRoute("/crash-handling", CrashHandling);
  sub.addRoute("/counter-with-store", CounterWithStore);
  sub.addRoute("/local-stores", LocalStores);
  sub.addRedirect("*", "./spring-animation");
});

app.addRoute("/7guis", SevenGUIs, (sub) => {
  sub.addRoute("/counter", Counter);
  sub.addRoute("/temp-converter", TempConverter);
  sub.addRoute("/flight-booker", FlightBooker);
  sub.addRoute("/timer", Timer);
  sub.addRoute("/crud", CRUD);
  sub.addRoute("/circle-drawer", CircleDrawer);
  sub.addRoute("/cells", Cells);
  sub.addRedirect("*", "./counter");
});

// Manual tests to make sure routing and redirects are working
app
  .addRoute("/router-test/one", () => <h1>One</h1>)
  .addRoute("/router-test/two", () => <h1>Two</h1>)
  .addRedirect("/router-test/*", "/router-test/one");

app.addRoute(
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
);

app.addRoute("/tests", null, (sub) => {
  sub.addRoute("/render-order", RenderOrderTest);
});

// For any route not registered, redirect to a route that does exist.
app.addRedirect("*", "./examples");

// ----- Connect App ----- //

app.connect("#app");

import { App, Ref } from "@borf/browser";

import { CounterStore } from "./stores/CounterStore";
import { MouseStore } from "./stores/MouseStore";

import { AppLayout } from "./AppLayout";

import { CounterWithStore } from "./examples/CounterWithStore";
import { CrashHandling } from "./examples/CrashHandling";
import { Languages } from "./examples/Languages";
import { SpringAnimation } from "./examples/SpringAnimation";
import { PassingAttributes } from "./examples/PassingAttributes";
import { HTTPRequests } from "./examples/HTTPRequests";

import { RenderOrderTest } from "./views/RenderOrderTest";

import SevenGUIs from "./7guis";
import Counter from "./7guis/01_Counter";
import TempConverter from "./7guis/02_TempConverter";
import FlightBooker from "./7guis/03_FlightBooker";
import Timer from "./7guis/04_Timer";
import CRUD from "./7guis/05_CRUD";
import CircleDrawer from "./7guis/06_CircleDrawer";
import Cells from "./7guis/07_Cells";

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
  // mode: import.meta.env.MODE,
});

// ----- Language Support ----- //

app.language("en-US", {
  translation: {
    greeting: "Howdy pardner",
  },
});

app.language("en-GB", {
  // Use an async function to fetch translations from a server.
  translation: async () => {
    return Promise.resolve({
      greeting: "Oi guv'nah",
    });
  },
});

app.language("ja", {
  // Or pass a string which is assumed to be a path to a JSON file to be requested over HTTP?
  translation: "/api/lang/ja.json",
});

// Auto-detect language, falling back to en-US if no appropriate match is found.
// app.setLanguage("auto", "en-US");

// ----- Stores ----- //

app.store(CounterStore);
app.store(MouseStore);

// ----- Root View & Routing ----- //

app.main(AppLayout);

// Testing why nested refs aren't getting the correct element.
app.route("/test/nested-refs", (props, c) => {
  c.name = "Nested Refs";

  const containerRef = new Ref();
  const headerRef = new Ref();
  const textRef = new Ref();

  c.onConnected(() => {
    c.log({ containerRef, headerRef, textRef });
  });

  return (
    <section ref={containerRef} class="container">
      <header ref={headerRef} class="header">
        <h1 ref={textRef} class="text">
          Header
        </h1>
      </header>
      <p>Content</p>
    </section>
  );
});

app.route("/examples", null, (sub) => {
  sub.route("/spring-animation", SpringAnimation);
  sub.route("/languages", Languages);
  sub.route("/crash-handling", CrashHandling);
  sub.route("/counter-with-store", CounterWithStore);
  sub.route("/passing-attributes", PassingAttributes);
  sub.route("/http-requests", HTTPRequests);
  sub.redirect("*", "./spring-animation");
});

app.route("/7guis", SevenGUIs, (sub) => {
  sub.route("/counter", Counter);
  sub.route("/temp-converter", TempConverter);
  sub.route("/flight-booker", FlightBooker);
  sub.route("/timer", Timer);
  sub.route("/crud", CRUD);
  sub.route("/circle-drawer", CircleDrawer);
  sub.route("/cells", Cells);
  sub.redirect("*", "./counter");
});

app
  .route("/router-test/one", () => <h1>One</h1>)
  .route("/router-test/two", () => <h1>Two</h1>)
  .redirect("/router-test/*", "/router-test/one");

app.route("/multiple-element-root", function MultipleElementRoot() {
  return [
    <h1>View with Multiple Root Elements</h1>,
    <p>You can't do this with React!</p>,
  ];
});

app.route(
  "/nested",
  function view(_, ctx) {
    return (
      <div>
        <h1>Nested Routes!</h1>
        {ctx.outlet()}
      </div>
    );
  },
  function extend(sub) {
    sub
      .route("/one", () => <h1>Nested #1</h1>)
      .route("/two", () => <h1>Nested #2</h1>)
      .redirect("*", "./one");
  }
);

app.route("/tests", null, (sub) => {
  sub.route("/render-order", RenderOrderTest);
});

// For any route not registered, redirect to a route that does exist.
app.redirect("*", "/examples");

// ----- Connect App ----- //

app.connect("#app");

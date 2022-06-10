import "./styles/demo.css";

import { makeApp } from "@woofjs/client";

import CounterService from "./services/CounterService.js";
import MouseService from "./services/MouseService.js";

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

function AppLayout($, self) {
  self.debug.name = "🐕";
  self.debug.log("hi");

  logLifecycle(self);

  // self.loadRoute((show, done) => {
  //   // When the done() function is called, this content is removed and the real component is connected.

  //   return show(
  //     <div>
  //       <h1>WELCOME</h1>
  //       <p>This page has examples of things woof can do.</p>
  //       <p>
  //         Click the button below to demonstrate calling <code>done()</code> in a component's preload hook. When it's
  //         triggered by an event, you can create disclaimer pages like this. Generally you would use this to show temp
  //         content while making API calls.
  //       </p>
  //       <button onclick={() => done()} title="demonstrate calling done() in a component's preload hook">
  //         Continue
  //       </button>
  //     </div>
  //   );
  // });

  const page = self.getService("@page");
  const mouse = self.getService("mouse");

  // Display current mouse coordinates as tab title
  self.watchState(mouse.$position, (pos) => {
    page.$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
  });

  return (
    <div class="demo">
      <nav class="nav">
        <ul>
          <li>
            <a href="/examples">Examples</a>
          </li>
          <li>
            <a href="/7guis">7 GUIs</a>
          </li>
          <li>
            <a href="/router-test">Router Test</a>
          </li>
          <li>
            <a href="/nested/one">Nested: #1</a>
          </li>
          <li>
            <a href="/nested/two">Nested: #2</a>
          </li>
          <li>
            <a href="/nested/invalid">Nested: Redirect *</a>
          </li>
        </ul>
      </nav>

      {self.children}
    </div>
  );
}

app.route("*", AppLayout, ({ route, redirect }) => {
  route("/examples", ($) => {
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

  route("/7guis", SevenGUIs, ({ route, redirect }) => {
    route("/counter", Counter);
    route("/temp-converter", TempConverter);
    route("/flight-booker", FlightBooker);
    route("/timer", Timer);
    route("/crud", CRUD);
    route("/circle-drawer", CircleDrawer);
    route("/cells", Cells);

    redirect("*", "./counter");
  });

  route("/router-test/one", ($, self) => {
    self.debug.log(self.$route.get());

    return <h1>One</h1>;
  });

  route("/router-test/two", ($, self) => {
    self.debug.log(self.$route.get());

    return <h1>Two</h1>;
  });

  redirect("/router-test/*", "/router-test/one");

  route(
    "/nested",
    ($, self) => (
      <div>
        <h1>Nested Routes!</h1>

        {self.children}
      </div>
    ),
    ({ route, redirect }) => {
      route("/one", ($) => <h1>NESTED #1</h1>);
      route("/two", ($) => <h1>NESTED #2</h1>);
      redirect("*", "./one");
    }
  );

  redirect("*", "./examples");
});

app.route("*", ($, self) => {
  self.debug.name = "🐕";
  self.debug.log("hi");

  logLifecycle(self);

  // self.loadRoute((show, done) => {
  //   // When the done() function is called, this content is removed and the real component is connected.

  //   return show(
  //     <div>
  //       <h1>WELCOME</h1>
  //       <p>This page has examples of things woof can do.</p>
  //       <p>
  //         Click the button below to demonstrate calling <code>done()</code> in a component's preload hook. When it's
  //         triggered by an event, you can create disclaimer pages like this. Generally you would use this to show temp
  //         content while making API calls.
  //       </p>
  //       <button onclick={() => done()} title="demonstrate calling done() in a component's preload hook">
  //         Continue
  //       </button>
  //     </div>
  //   );
  // });

  const page = self.getService("@page");
  const mouse = self.getService("mouse");

  // Display current mouse coordinates as tab title
  self.watchState(mouse.$position, (pos) => {
    page.$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
  });

  return (
    <div class="demo">
      <nav class="nav">
        <ul>
          <li>
            <a href="/examples">Examples</a>
          </li>
          <li>
            <a href="/7guis">7 GUIs</a>
          </li>
          <li>
            <a href="/router-test">Router Test</a>
          </li>
          <li>
            <a href="/nested/one">Nested: #1</a>
          </li>
          <li>
            <a href="/nested/two">Nested: #2</a>
          </li>
          <li>
            <a href="/nested/invalid">Nested: Redirect *</a>
          </li>
        </ul>
      </nav>

      {$.router((self) => {
        self.route("examples", ($) => {
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

        self.route("7guis/*", SevenGUIs);

        self.route("router-test/*", ($) => {
          // Nested routers to test redirect issue
          // Does not automatically match nested routes when coming in from a different page
          // This happens when the redirect should kick in, but it doesn't.
          return $.router(({ route, redirect }) => {
            route("one", ($, self) => {
              self.debug.log(self.$route.get());

              return <h1>One</h1>;
            });

            route("two", ($, self) => {
              self.debug.log(self.$route.get());

              return <h1>Two</h1>;
            });

            redirect("*", "./one");
          });
        });

        self.route("nested/*", ($) => {
          return (
            <div>
              <h1>Nested Routes!</h1>

              {$.router((self) => {
                self.route("one", ($) => <h1>NESTED #1</h1>);
                self.route("two", ($) => <h1>NESTED #2</h1>);
                self.redirect("*", "/nested/one");
              })}
            </div>
          );
        });

        self.redirect("*", "./examples");
      })}
    </div>
  );
});

app.connect("#app");

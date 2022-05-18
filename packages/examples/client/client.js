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

app.route("*", ($, self) => {
  self.debug.name = "🐕";
  self.debug.log("hi");

  logLifecycle(self);

  self.loadRoute((show, done) => {
    // When the done() function is called, this content is removed and the real component is connected.

    return show(
      <div>
        <h1>WELCOME</h1>
        <p>This page has examples of things woof can do.</p>
        <p>
          Click the button below to demonstrate calling <code>done()</code> in a component's preload hook. When it's
          triggered by an event, you can create disclaimer pages like this. Generally you would use this to show temp
          content while making API calls.
        </p>
        <button onclick={() => done()} title="demonstrate calling done() in a component's preload hook">
          Continue
        </button>
      </div>
    );
  });

  self.connected(() => {
    const page = self.getService("@page");
    const mouse = self.getService("mouse");

    // Display current mouse coordinates as tab title
    self.watchState(mouse.$position, (pos) => {
      page.$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
    });
  });

  return (
    <div class="demo">
      <nav class="nav">
        <ul>
          <li>
            <a href="/examples">Examples</a>
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

        self.route("router-test/*", ($) => {
          // Nested routers to test redirect issue
          // Does not automatically match nested routes when coming in from a different page
          // This happens when the redirect should kick in, but it doesn't.
          return $.router(({ route, redirect }) => {
            route("one", ($) => {
              return <h1>One</h1>;
            });

            route("two", ($) => {
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

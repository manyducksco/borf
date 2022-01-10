import "./styles/demo.css";

import { makeApp } from "@woofjs/app";

import CounterService from "./services/CounterService.js";
import MouseService from "./services/MouseService.js";

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

// TODO: Fix error evaluating .isConnected on element when null is returned from a component.

app.route("*", ($, self) => {
  self.debug.name = "🐕";
  self.debug.log("hi");

  logLifecycle(self);

  self.preload((done) => {
    // When the done() function is called, this content is removed and the real component is connected.
    return (
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

      {$.outlet()
        .route("examples", ($) => (
          <div>
            <ToggleExample />
            <CounterExample />
            <ConditionalExample />
            <DynamicListExample />
            <TwoWayBindExample />
            <FormExample />
            <MouseFollowerExample />
            <HTTPRequestExample />
          </div>
        ))
        .route("nested/*", ($) => (
          <div>
            <h1>Nested Routes!</h1>
            {$.outlet()
              .route("one", ($) => <h1>NESTED #1</h1>)
              .route("two", ($) => <h1>NESTED #2</h1>)
              .route("*", "/nested/one")}
          </div>
        ))}
    </div>
  );
});

app.connect("#app");

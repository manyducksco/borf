import test from "ava";
import { StateMachine } from "./StateMachine.js";

type States = "red" | "yellow" | "green" | "offline";
type Signals = "NEXT" | "OFF" | "ON";

test("works", (t) => {
  const light = new StateMachine<States, Signals>("red", {
    green: {
      signals: { NEXT: "yellow", OFF: "offline" },
    },
    yellow: {
      signals: { NEXT: "red", OFF: "offline" },
    },
    red: {
      signals: { NEXT: "green", OFF: "offline" },
    },
    offline: {
      signals: { ON: "red" },
    },
  });

  t.deepEqual(light.signalsOf("green"), ["NEXT", "OFF"]);

  t.is(light.state, "red");

  const changed = light.signal("NEXT"); // red -> green
  t.assert(changed);
  t.is(light.state, "green");

  light.signal("NEXT"); // green -> yellow
  t.is(light.state, "yellow");
  light.signal("NEXT"); // yellow -> red
  t.is(light.state, "red");
  light.signal("OFF"); // red -> offline
  t.is(light.state, "offline");
  light.signal("NEXT"); // offline -> offline (offline doesn't respond to this signal)
  t.is(light.state, "offline");
  light.signal("NEXT"); // ...
  t.is(light.state, "offline");
  light.signal("ON"); // offline -> red (back online)
  t.is(light.state, "red");
  light.signal("NEXT"); // red -> green
  t.is(light.state, "green");

  light.signal("NEXT", (changed, newValue, oldValue) => {
    // Callback is called synchronously. Use it to inspect the results of the signal.
    t.assert(changed);
    t.is(newValue, "yellow");
    t.is(oldValue, "green");
  });

  let received: string[] = [];

  const unsubscribe = light.subscribe((state) => {
    received.push(state);
  });

  light.signal("NEXT"); // yellow -> red

  unsubscribe();

  light.signal("NEXT"); // red -> green
  t.is(light.state, "green");

  // Got 'yellow' on initial subscribe; got 'red' from the following NEXT signal; did not get 'green' because subscription was cancelled.
  t.deepEqual(received, ["yellow", "red"]);
});

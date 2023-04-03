# StateMachine

```ts
type TrafficLights = "red" | "yellow" | "green";

/**
 * Represents a traffic light with green, yellow and red lights. Also supports an "offline" mode
 * where the yellow light just flashes on and off.
 */
const light = new StateMachine<TrafficLights>("red", {
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

light.signalsOf("green"); // ["NEXT", "OFF"]

// ----- Signal Transitions ----- //

const changed = light.send("NEXT"); // red -> green
// changed = true

light.send("NEXT", (changed, newValue, oldValue) => {
  // Callback is called synchronously. Use it to inspect the results of the signal.
});

light.send("NEXT"); // green -> yellow
light.send("NEXT"); // yellow -> red
light.send("OFF"); // red -> offline
light.send("NEXT"); // offline -> offline (offline doesn't respond to this signal)
light.send("NEXT"); // ...
light.send("ON"); // offline -> red (back online)
light.send("NEXT"); // red -> green

// ----- Observability ----- //

light.state; // "green"

const sub = light.subscribe((state) => {
  if (state === "green") {
    // Called when state changes to "green".
  }
});
```

## Ideas

- It would be fun to make a text adventure engine based on StateMachine.

```js
import Help from "./Help.js";
import { Umbrella_Taken } from "./Umbrella_Taken.js";
import { Umbrella_Left } from "./Umbrella_Left.js";

export const Umbrella = new Scene({
  text: "You see an umbrella. Do you want to [take] it or [leave] it?",
  keywords: {
    take: { go: Umbrella_Taken },
    leave: { go: Umbrella_Left },
  },
});
```

I have never even created a text adventure before so I have no idea if this would be a good structure. Seems like it would be easy to jump around and edit conversations, but managing this as a file structure might be hard.

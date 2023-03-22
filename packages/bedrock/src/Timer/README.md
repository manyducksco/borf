# Timer

A simple execution timer with formatting for display. Rounds to nearest time unit.

```js
import { Timer } from "@borf/bedrock";

const timer = new Timer();

// Run some expensive or long-running async code.

console.log(`Finished after ${timer.formatted}`);
```

Aside from the main functionality, there are a few other things Timer can do.

```js
const formatted = Timer.format(5819823); // Format milliseconds without a timer instance.

const timer = new Timer();

timer.elapsed; // Get raw milliseconds without formatting
Timer.format(timer.elapsed); // Equivalent to `timer.formatted`

timer.reset(); // Start counting again from right now.
```

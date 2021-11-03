# Source

Use Sources (ideas):

```js
// create a Source for a DOM event where the receivers take the event object
const clicks = new EventSource(domNode, "click");
clicks.receive((e) => {
  // handle click events on domNode
});

// create a ref to pass to your element and a Source to handle the events
// ref is just a function that will be called with an HTMLElement
const [ref, clicks] = new EventRefSource("click");
button({ ref });
clicks.receive((e) => {
  // handle click event from button
});

// calls the function every 50ms and sends if the value is different than the last call
const poll = new PollSource(() => form.errors, 50);

const ticks = new TickSource(1000);
const receiver = ticks.receive();
receiver.listen(() => {
  // do something every 1000 milliseconds
});

// sends a new message at the top of each second
const seconds = new ClockSource("second");

// sends a new message every 5 minutes on the dot
const time = new CronSource("*/5 * * * *");
```

Create your own Source:

```ts
import { Source } from "***";

class ShoutySource extends Source {
  shout(phrase) {
    this.value = phrase.toUpperCase();
    this.broadcast();
  }
}

const source = new ShoutySource("");

source.listen((phrase) => {
  // phrase = "HELLO WORLD!"
});

source.shout("hello world!");
```

Control how values are received:

```js
// There are utility functions that take a Receivable and return a new Receivable:

const mapped = source.map(value => /* return derived value */);

const filtered = source.filter(value => /* return true or false */);

// receives events delayed by a number of milliseconds
const delayed = source.delay(200);

// send as array when received messages accumulate to 5, or when there is at least one message and 2000 milliseconds have elapsed since the last send
const batched = source.batch(5, 2000);

// sends only the latest value received within a 300ms value since the last message was sent
const debounced = source.debounce(300);
```

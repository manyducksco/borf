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

const receiver = source.receive();
receiver.listen((phrase) => {
  // phrase = "HELLO WORLD!"
});

source.shout("hello world!");
```

Control how values are received through operators:

```js
// There are utility functions that take a Receivable and return a new Receivable:

const mapped = map(receiver, value => /* return derived value */);

const filtered = filter(receiver, value => /* return true or false */);

// send as array when received messages accumulate to 5, or when there is at least one message and 2000 milliseconds have elapsed since the last send
const batched = batch(receiver, 5, 2000);

// sends only the latest value received within a 300ms value since the last message was sent
const debounced = debounce(receiver, 300);

// create a chain where the return value of the previous function is passed to the next
const chained = chain(receiver, [
  s => debounce(s, 300)
  s => filter(s, value => value % 2 === 0),
  s => map(s, value => value * 2),
]);
```

# Receivable

Use Senders (ideas):

```js
// create a Sender for a DOM event where the receivers take the event object
const clicks = new EventSender(domNode, "click");
clicks.receive((e) => {
  // handle click events on domNode
});

// create a ref to pass to your element and a Sender to handle the events
// ref is just a function that will be called with an HTMLElement
const [ref, clicks] = new EventRefSender("click");
button({ ref });
clicks.receive((e) => {
  // handle click event from button
});

// calls the function every 50ms and sends if the value is different than the last call
const poll = new PollSender(() => form.errors, 50);

const ticks = new TickSender(1000);
ticks.receive(() => {
  // do something every 1000 milliseconds
});

// sends a new message at the top of each second
const seconds = new ClockSender("second");

// sends a new message every 5 minutes on the dot
const time = new CronSender("*/5 * * * *");
```

Create your own Sender:

```ts
import { Sender } from "***";

class ShoutySender extends Sender {
  shout(phrase) {
    this._send(phrase.toUpperCase());
  }
}

const sender = new ShoutySender();

sender.receive((phrase) => {
  // phrase = "HELLO WORLD!"
});

sender.shout("hello world!");
```

Control how values are received through operators:

```js
// There are utility functions that take a Receiver and return a new Receivable:

const mapped = map(receiver, value => /* return derived value */);

const filtered = filter(receiver, value => /* return true or false */);

// send as array when received messages accumulate to 5, or when there is at least one message and 2000 milliseconds have elapsed since the last send
const batched = batch(receiver, 5, 2000);

// sends only the latest message received within a 300ms window since the last message was sent
const debounced = debounce(receiver, 300);

// create a chain where the return value of the previous function is passed to the next
const chained = chain(receiver, [
  receiver => debounce(receiver, 300)
  receiver => filter(receiver, value => value % 2 === 0),
  receiver => map(receiver, value => value * 2),
]);

// alternative: chained API where you pass the function and all parameters besides the receiver
// can this be typed? it would need to extract the function arg types
const chained = chain(receiver)
  .to(debounce, 300)
  .to(filter, value => value % 2 === 0)
  .to(map, value => value * 2);

// create a new Sender out of a Receiver without modifying the value
const relayed = relay(receiver);
```

# Receivable

```js
// There are utility functions that take a Receiver and return a new Receivable:

const mapped = map(receiver, value => /* return derived value */);

const filtered = filter(receiver, value => /* return true or false */);

// send as array when received messages accumulate to 5, or when there is at least one message and 2000 milliseconds have elapsed since the last send
const batched = batch(receiver, 5, 2000);

// sends only the latest message received within a 300ms window since the last message was sent
const debounced = debounce(receiver, 300);

// create a receiver for a DOM event where the receiver's callback is the handler
const clicks = receiveEvent(domNode, "click");

// or? return a ref to pass to your element and a receivable to handle the events
// the ref would be a kind of receiver itself that triggers this function to set up the handler
const [ref, clicks] = receiveEventRef("click");
button({ ref });
clicks.receive(e => {
  // handle click event from button
});

// create a chain where the return value of the previous
// function is passed to the next
const chained = chain([
  receiver => map(receiver, value => value * 2),
  receiver => filter(receiver, value => value % 2 === 0),
  receiver => debounce(receiver, 300)
]);

// create a new Receivable out of a Receiver without modifying the value
const relayed = relay(receiver);

// calls the passed function every 50ms and sends if the value is different than the last call
const receiver = poll(() => form.errors, 50);
```

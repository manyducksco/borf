# PubSub

The simplest possible publish/subscribe mechanism.

```js
import { PubSub } from "@borf/bedrock";

const pubsub = new PubSub();

// Listen for any publishes that occur after this point.
const unsubscribe = pubsub.subscribe((value) => {
  console.log(`New value: ${value}`);
});

pubsub.publish(1); // prints "New value: 1"
pubsub.publish(2); // prints "New value: 2"
pubsub.publish(3); // prints "New value: 3"

unsubscribe(); // Stop receiving new publishes.

pubsub.publish(4); // Not received
pubsub.publish(5); // Not received
```

## TypeScript

Pass a type argument to restrict this PubSub to a specific type. TypeScript will consider it an error when the wrong type is published. PubSub's type defaults to `any`.

```ts
const strings = new PubSub<string>();
const numbers = new PubSub<number>();

strings.publish("this is valid");
strings.publish(5); // won't compile

numbers.publish(72);
numbers.publish({}); // won't compile
```

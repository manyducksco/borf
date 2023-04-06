# @borf/bedrock

![bundle size](https://img.shields.io/bundlephobia/min/@borf/bedrock)
![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/bedrock)

Bedrock is a toolbox of classes that adds useful new types and expands on some of JavaScript's built-in ones. Bedrock is a supplement to the JS standard library. It includes things that don't necessarily need to be built into the language, but are still useful building blocks for many different kinds of projects.

Bedrock is fully tree-shakeable. That means if you bundle your scripts (with a tool like [Webpack](https://webpack.js.org/) or [@borf/build](https://www.npmjs.com/package/@borf/build)), only classes you actually use will add to your bundle size.

## What's in it?

### Type checking and additional types

- [Type](./src/Type/README.md) (type checking swiss army knife)
- [Hash](./src/Hash/README.md) (extension of Map)
- [List](./srcList/README.md) (extension of Array)
- [StateMachine](./src/StateMachine/README.md) (implementation of a finite state machine)

### Pub/sub and events

- [PubSub](./src/PubSub/README.md) (simple publish/subscribe mechanism)
- [EventEmitter](./src/EventEmitter/README.md) (listen for and emit named events with data)

### HTTP requests and route matching

- [HTTPClient](./src/HTTPClient/README.md) (refined interface for making API calls)
- [Router](./src/Router/README.md) (simple route matcher)

### Queue processing

- [BatchQueue](./src/BatchQueue/README.md) (async queue with cap on total active promises)
- [ThrottleQueue](./src/ThrottleQueue/README.md) (async queue with cap on # of promises awaited per second)

### Other Utilities

- [Timer](./src/Timer/README.md) (precision timer with formatting for timing code execution time)

## Install and use

```
> npm i @borf/bedrock
```

Meanwhile, in a nearby file:

```js
import { List } from "@borf/bedrock";

const list = new List([1, 2, 3]);

console.log(
  `List has ${list.length} item(s), and the last one is: ${list.last()}`
);
```

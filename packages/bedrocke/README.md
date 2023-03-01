# Bedrocke

> Part of FRAMEWORKE: [Bedrocke]() | [Builde]() | [Woofe]() | [Growle]()

> SUB 1.0: Expect breaking changes left and right in the smallest of point releases. This README isn't even finished. Use at your own risk.

Bedrocke is a toolbox of classes that adds useful new types and expands on some of JavaScript's built-in ones. Bedrocke is intended as a supplement to the JS standard library. It includes things that don't necessarily need to be built into the language, but are still useful as building blocks for your project.

Bedrocke is fully tree-shakeable. That means if you bundle your scripts (with a tool like [Webpack](https://webpack.js.org/) or [Builde]()), classes you don't import won't add to your bundle size.

- [Type](./Type/README.md) (type checking swiss army knife)
- [Hash](./Hash/README.md) (superset of Map)
- [List](./List/README.md) (superset of Array)
- [Observable](./Observable/README.md) (implementation of the long awaited TC39 Observable proposal)
- [StateMachine](./StateMachine/README.md) (implementation of a finite state machine)
- [BatchQueue](./BatchQueue/README.md) (async queue with cap on total active promises)
- [PerSecondQueue](./PerSecondQueue/README.md) (async queue with cap on # of promises awaited per second)
- [HTTPClient](./HTTPClient/README.md) (refined interface for making API calls)
- [Router](./Router/README.md) (simple route matcher)

## Misc Ideas

### AttrTypes

Like PropTypes in React. Actual attributes will be validated against this structure any time they change while in development mode. Throws a descriptive error if the value doesn't match.

```js
import { AttrTypes } from "@woofjs/client";

function Component() {
  // Error is thrown if at any point `value` is not a string.
  const $value = this.$attrs.map("value");

  return <div>{$value}</div>;
}

Component.attrTypes = {
  value: AttrTypes.string.isRequired,
  object: AttrTypes.shape({
    id: AttrTypes.number.isRequired,
    url: AttrTypes.custom(({ value }) => {
      if (!/^https?:\/\//.test(value)) {
        return "Expected a URL";
      }
    }),
    category: AttrTypes.oneOf("One", "Two"),
    data: AttrTypes.oneOfType(AttrTypes.string, AttrTypes.number),
    list: AttrTypes.array,
    detailedList: AttrTypes.arrayOf("One", "Two"),
    dataList: AttrTypes.arrayOfType(AttrTypes.string, AttrTypes.number),
  }),
};
```

### makeStore

> IMPLEMENTED

```js
import { makeStore } from "@woofjs/client";

// Contents are stored in localStorage with this key.
// Values persist between page reloads.
const $state = makeStore("some-name");

// Showing all arguments. Uses sessionStorage if session: true
const $state = makeStore("key", defaultValue, { session: true });
```

### Drag and Drop

Well, I don't know what this idea would be, but there definitely needs to be a way to wrap the drag and drop API to make it easier to use. Raw drag and drop is a bit rough.

### TypeScript Woes

There have been a few changes I have made for the benefit of TypeScript. This is something I said I wasn't going to do. For example, changing how you register services; originally individual function calls and now as an object passed in the app options.

I'd like to roll these back and think of alternate ways to specify types for services.

```tsx
const Example = makeComponent((ctx) => {
  // These would be correctly typed based on AppServices.
  const [http, counter] = ctx.service<AppServices>(["http", "counter"]);

  // Single service syntax; correctly typed as HTTPService since it's built in.
  const http = ctx.service("http");

  // Pass AppServices to infer types of your own services.
  const counter = ctx.service<AppServices>("counter");
});

// With regular JS
const Example = makeComponent((ctx) => {
  const [http, counter] = ctx.service(["http", "counter"]);

  // Inferred as HTTPService in JS
  const http = ctx.service("http");

  // Not inferrable in JS, but will throw error if not registered.
  const counter = ctx.service("counter");
});
```

Also, would services be clearer if they were defined as classes?

```js
class CounterService extends Service {
  $value = makeState(0);

  increment() {
    this.$value.set((v) => v + 1);
  }

  decrement() {
    this.$value.set((v) => v - 1);
  }
}
```

One problem with this approach is that without TypeScript or #properties you can't have private variables in services or control what you export.

```tsx
class Example extends Component {
  render() {
    const counter = this.service<CounterService>("counter");

    // This scenario also wouldn't work because counter.* methods would not longer have reference to `this`.
    return (
      <div>
        <h1>{counter.$value}</h1>
        <button onclick={counter.increment}>+1</button>
        <button onclick={counter.decrement}>-1</button>
      </div>
    );
  }
}
```

With `makeService` and `makeComponent` the above looks like this:

```tsx
// In "services/counter.ts"

export const CounterService = makeService(() => {
  const $value = makeState(0);

  return {
    // More control over exports; $value is now read only from outside the service.
    $value: $value.map(),

    increment() {
      $value.set((v) => v + 1);
    },

    decrement() {
      $value.set((v) => v - 1);
    },
  };
});

// In "components/Example/Example.tsx"

import type { CounterService } from "services/counter";

const Example = makeComponent((ctx) => {
  const counter = ctx.service<CounterService>("counter");

  // This now works because `this` is not referenced inside the service.
  // $value is in scope of the methods so they can't lose reference to it.
  return (
    <div>
      <h1>{counter.$value}</h1>
      <button onclick={counter.increment}>+1</button>
      <button onclick={counter.decrement}>-1</button>
    </div>
  );
});
```

#### Defining `AppServices`

Service types can't be inferred from the app since we're rolling back to adding each service through a method. This means the AppServices type needs to be defined by you.

```tsx
export type AppServices = {
  counter: CounterService;
};

// Pass your AppServices as a type parameter
const app = makeApp<AppServices>();

// And these calls will be type checked against AppServices.
app.service("counter", CounterService);

// TS error because `other` is not on AppServices
app.service("other", OtherService);

// TS error because `counter` is the wrong service.
app.service("counter", OtherService);
```

The upside here is that you can't register a service you haven't defined, or register a service under the wrong name. The downside is that this method doesn't guarantee everything in AppServices is actually registered. However, the change back to `ctx.service("name")` does guarantee that accessing a service that isn't registered will throw an error.

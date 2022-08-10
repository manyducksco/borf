# Autocomplete Considerations

```tsx
function Example({ $attrs }) {
  return <h1>{$attrs.map("title")}</h1>;
}

// Could instantiate like this, so the context and `this` could be typed.
const Example = new Component(({ $attrs }) => {
  return <h1>{$attrs.map("title")}</h1>;
});

// Another style of the above that does the same thing.
class Example extends Component {
  // 'bootstrap' is the woof version of 'render'
  // so named because it gets called once when the component is first initialized
  bootstrap() {
    return <h1>{this.$attrs.map("title")}</h1>;
  }

  beforeConnect() {}
  afterConnect() {}
  beforeDisconnect() {}
  afterDisconnect() {}
}

// Attrs and services can be typed through type arguments
class Component<AttrsType, ServicesType> {}

// Usage from TypeScript
const Example = new Component<{ title: string }>(({ $attrs }) => {
  // $title is now a ReadOnlyState<string>
  const $title = $attrs.map((attrs) => attrs.title);

  return <h1>{$title}</h1>;
});

// Or the class extension way:
class Example extends Component<{ title: string }> {
  bootstrap() {
    const $title = this.$attrs.map(function (attrs) {
      return attrs.title;
    });

    return <h1>{$title}</h1>;
  }
}
```

Ideally services can be typed when writing clients in TS. There needs to be a way to extract the ServicesType from an App so it can be imported into each component file and used as a type argument.

## Services

```ts
// Plain function style
function Example(self) {
  return {
    callMe() {
      self.debug.log("もしもし");
    },
  };
}

// Class instance style
const Example = new Service((self) => {
  self.beforeConnect(() => {
    // Do something before app starts.
  });

  self.afterConnect(() => {
    // Do something once routes have been mounted.
  });

  return {
    callMe() {
      self.debug.log("もしもし");
    },
  };
});

// Pure class style
class Example extends Service {
  callMe() {
    this.debug.log("もしもし");
  }

  _beforeConnect() {
    // Do something before app starts.
  }

  _afterConnect() {
    // Do something once routes have been mounted.
  }
}
```

Types would work roughly the same way as components.

```ts
class Service<OptionsType, ServicesType> {}
```

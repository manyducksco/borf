# Autocomplete Considerations

```tsx
function Example ({ $attrs }) {
  return <h1>{$attrs.map('title')}</h1>
}

// Could instantiate like this, so the context and `this` could be typed.
const Example = new Component(({ $attrs }) => {
  return <h1>{$attrs.map('title')}</h1>
})

// Aspects of the component can be typed through type arguments
class Component<AttrsType, ServicesType, ChildrenType> {}

// Usage from TypeScript
const Example = new Component<{ title: string }, AppServices, void>(({ $attrs }) => {
  // $title is now a MapState<string>
  const $title = $attrs.map(attrs => attrs.title)

  return <h1>{$title}</h1>
})
```

Ideally services can be typed when writing clients in TS. There needs to be a way to extract the ServicesType from an App so it can be imported into each component file and used as a type argument.

## Services

```ts
// Plain function style
function Example (self) {
  return {
    callMe () {
      self.debug.log('もしもし')
    }
  }
}

// Class instance style
const Example = new Service(self => {
  self.beforeConnect(() => {
    // Do something before app starts.
  })

  self.afterConnect(() => {
    // Do something once routes have been mounted.
  })

  return {
    callMe () {
      self.debug.log('もしもし')
    }
  }
})
```

Types would work roughly the same way as components.

```ts
class Service<OptionsType, ServicesType> {}
```

Also while we're on this whole class thing, states could be redone as classes.

```tsx
// One main constructor to create a state
const $state = new State(5)

// Static methods to create special types
const $proxy = State.proxy()
const $merged = State.merge($state1, $state2, (s1, s2) => s1 + s2)
```

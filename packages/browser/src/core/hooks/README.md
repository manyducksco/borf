This is based on an idea I had to retool with HTM for templates and a hook-like API for accessing aspects of a component from inside the body of the component.

For now, this can be a layer on top of the `self: ComponentCore` setup we have now until we decide if it's good or not.

```ts
const exampleViewAttrsSchema = z.object({
  value: z.string().optional(),
});

type ExampleViewAttrs = {
  value?: string;
};

// Now that component function takes no args, it's possible to take a fake attributes object for TSX inference.
function ExampleView(_: ExampleViewAttrs) {
  // TODO: Idea; hook-like API + html tagged template literals
  useName("view:SomeOtherName");

  const $$value = new Writable(5); // Still using new to create things, still a stable component scope.

  // TS is pointless with string templates, but runtime parsing will do the trick
  // Also passing a Zod schema will automatically infer types for input values
  const { $, $$ } = useAttributes({ schema: exampleViewAttrsSchema });

  // For TS, type argument must be given. Any Readables and Writables will be unwrapped to their content values.
  const attrs = useAttributes<ExampleViewAttrs>();

  const http = useStore("http");
  const other = useStore(OtherStore);

  // One advantage of this is that it will silently redirect all console.* refs in this component to the inbuilt logger without modification.
  const console = useConsole();

  useConnected(() => {
    console.log("Witchcraft! Labeled console logging. Oh, also we're connected now.");
  });

  const { $path, $params, $$query, navigate } = useStore("router");
  const { $visibility } = useStore("document");
  const { translate } = useStore("language");
  const http = useStore("http");

  const $label = $("label");
  const $min = $("min");
  const $max = $("max");
  const $$value = $$("value");

  return html`
    <div class=${styles.controlGroup}>
      <label for=${$label}>
        <span>${$label}</span>
        <span class=${styles.controlLabel}>${$$value}</span>
      </label>

      <input class=${styles.controlInput} id=${$label} type="range" min=${$min} max=${$max} value=${$$value} />
    </div>
  `;
}
```

## Hooks

### useAttributes

### useLifecycle

Provides access to a component's lifecycle methods.

```js
const lifecycle = useLifecycle();

lifecycle.onConnected(() => {
  // On connected
});

lifecycle.onBeforeConnected(async () => {
  // Do an animation or something
});

// OR - event emitter style

const on = useLifecycle();

on("connected", () => {
  // On connected
});

on("beforeConnected", async () => {
  // Do an animation or something
});

// OR - separate hooks for each

useConnected(() => {
  // On connected
});

useBeforeConnect(async () => {
  // Do an animation or something
});
```

### useConsole

Shadows global console with a component-branded one.

```js
const console = useConsole();

console.log("This has the component's name on it in the console.");
```

### useStore

### Other Ideas

```js
const outlet = useOutlet(); // to render children?
return html`<div class="container">${outlet}</div>`;

useReadable($readable, (value) => {
  // Observes $readable while component is connected
});
useObserve($readable, (value) => {
  // Or does this name work better?
});

useName("ComponentName"); // to overwrite the default component name

useLoader(html`<div>Loading...</div>`); // to set the loader that shows when this async component is pending

// Events for lifecycle stuff and intercepting DOM events that bubble up from the root node.
const { on, emit } = useEvents();

on("connected", () => {});

on("beforeConnect", async () => {});

on("click", (e) => {
  // Listen for HTML events that bubble up
});

// Emit events that bubble up to parent components.
emit("someEvent", {
  /* payload */
});
```

```ts
// Simpler access to attributes?
// TODO: Maybe a hook to get each individual attribute? More verbose but maybe easier to follow?
const $$message = useProp("message");
const $$message = useProp<string>("message");
const $$message = useProp("message", { schema: z.string() });

// Alt name options:
const $$message = useAttribute("message");
const $$message = useAttr("message");
const $$message = useInput("message");
const $$message = useProp("message");

const value = useAttrValue("name");
const $value = useAttrReader("name");
const $$value = useAttrWriter("name");

const value = useInputValue("name");
const $value = useInputReader("name");
const $$value = useInputWriter("name");

const value = useAttributeValue("name");
const $value = useAttributeReader("name");
const $$value = useAttributeWriter("name");

// useAttribute returns a readable by default, or a writable if `options.writable` is true.
const value = useAttribute("name").value;
const $value = useAttribute("name");
const $$value = useAttribute("name", { writable: true });

type SomeType = ComponentAttrs<{
  someValue?: string;
}>;

// IDEA: Use Readable and Writable types as aliases to defined how attrs must be passed.
interface SomeType {
  // Expresses that this component will update this value.
  someValue?: Writer<string>; // accepted types: undefined, Writable<string>

  // Expresses that this component will only read this value.
  otherValue: Reader<number>; // accepted types: number, Readable<number>, Writable<number>
}

/**
 * Values that will be read by the component.
 */
type Reader<T> = T | Readable<T> | Writable<T>;
/**
 * Values that will be read and written by the component.
 */
type Writer<T> = Writable<T>;

// JSX compatible, where props are passed as a plain object.
// I want to keep html for browser compatibility, but type checking on JSX is a big deal for large apps with components you didn't write.
function JSXCompatExample(attrs: SomeType) {
  // Readable or Writable will be unwrapped, plain value will be passed through as-is.
  const value = useValue(attrs.someValue);

  // Creates a readable binding to attrs.someValue. Value can be undefined, a plain value, a readable, or a writable.
  const $value = useReader(attrs.someValue, { schema: z.string() });

  // attrs.someValue MUST be undefined, a writable or a plain value or this call will throw an error.
  const $$value = useWriter(attrs.someValue, { schema: z.string() });

  // Not allowed by TypeScript, and will also crash if otherValue is a readable binding.
  // Cannot useWriter on a Readable
  const $$other = useWriter(attrs.otherValue);

  const cancelNow = useObserver($value, (value) => {
    // This hook then gets renamed to useObserver
    // Returns a function to remove the observer immediately.
    // Automatically removed when component is disconnected.
  });

  // Hook to merge multiple readables into a new readable. Instead of Readable.merge()
  const $merged = useMerge([$value, $$value, $$other], (val, val2, val3) => {
    return "NEW VALUE";
  });

  // You can also create new values this way:
  const $$inline = useWriter(5);
  const $$inline = new Writable(5); // Equivalent (preferred when creating values, for clarity)
  $$inline.value = 7;

  // To render children, pass to useOutlet to create an outlet.
  // useOutlet accepts any array of Markup elements.
  const outlet = useOutlet(attrs.children);

  // You can of course just bypass all of this and use attrs directly if you know exactly what you're passing. This cuts down on the amount of code that has to run while operating the app.
}
```

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

useName("ComponentName"); // to overwrite the default component name

useLoader(html`<div>Loading...</div>`); // to set the loader that shows when this async component is pending
```

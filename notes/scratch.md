# Misc. ideas that don't yet have a better place to be

```ts
/**
 * A game loop that fires a callback 60 times per second.
 */
class GameLoop {
  #callback: (delta: number) => void;
  #stopped = true;
  #lastTick = 0;

  constructor(callback: (delta: number) => void) {
    this.#callback = callback;
  }

  #tick() {
    if (this.#stopped) return;

    if (typeof window?.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        const delta = Date.now() - this.#lastTick;
        this.#callback(delta);
        this.#tick();
      });
    } else {
      throw new Error(
        `GameLoop is currently only supported in browser environments.`
      );
    }
  }

  start() {
    this.#lastTick = Date.now();
    this.#tick();
    return this;
  }

  stop() {
    this.#stopped = true;
    return this;
  }
}

const loop = new GameLoop((delta) => {
  console.log(`It has been ${delta} ms since the last frame.`);
});

loop.start();
```

## onConnect/onDisconnect

Reduce lifecycle hooks to two; `onConnect` and `onDisconnect`. Setup functions can be async now, so that removes the need for a `beforeConnect`. Everything in the body of the setup function is basically `beforeConnect`. I also can't really imagine what you could do in `beforeDisconnect` that you couldn't do in `afterDisconnect`. Therefore, it makes sense to me to collapse them down to just one hook per action rather than a before and after.

Any code that accesses refs can go in `onConnect`, which runs after the component is attached to the DOM, while all cleanup code can go in `onDisconnect`, which runs after the component is no longer attached to the DOM.

## IDEA: More like old React style API

```tsx
import { State, View } from "woofe";

import { AuthStore } from "globals/AuthStore";
import { LoaderStore } from "globals/LoaderStore";
import { ThemeStore } from "globals/ThemeStore";
import { TranslateStore } from "globals/TranslateStore";

import TextInput from "views/TextInput";

import styles from "./Login.module.css";

type LoginAttrs = {
  username?: string;
  password?: string;
};

type LoginState = {
  username: string;
  password: string;
  connected: boolean;
};

async function setup() {
  const m = this.useMarkup();

  //
  this.onConnect(() => {
    this.log("connected");
  });

  return m("h1", "Hello There!");
}

const Login = makeView<LoginAttrs>({
  label: "Login",

  inputs: {
    username: {
      type: "string",
      optional: true,
      default: "",
    },
    password: {
      type: "string",
      optional: true,
      default: "",
    },
  },

  setup(ctx, m) {
    ctx.log("Hello");
  },
});

const NothingStore = new Store({
  setup(ctx, m) {
    return {
      /* ...nothing... */
    };
  },
});

const Login = View.define({
  setup(ctx, m) {},
});

const Login = new View<LoginAttrs>({
  setup(ctx, m) {
    const {} = ctx.useStore(NothingStore);

    const state = new State(5);
    ctx.log("Hello");
  },
});

Type.isPlainObject(value);
Type.isFunction(value);
Type.isAsyncFunction(value);
Type.isString(value);
Type.of(5); // "number"

const Example = new View({
  inputs: {
    value: {
      validate: Type.isString, // Use Type to make sure this input is a string.
    },
  },
});

const Example = new App({
  stores: [NothingStore],
  view: Login,
});

Example.connect("#some-element");

export class Login extends View<LoginAttrs, LoginState> {
  // Runtime input validation.
  // TODO: Decide if this name is funny or too stupid. I think it's funny so I can't trust my own opinion right now.
  static attributes = new Validattr({
    username: {
      type: "string",
      optional: true,
      default: "",
    },
    password: {
      type: "string",
      optional: true,
      default: "",
    },
  });

  $$value = new State("");

  get initialState() {
    return {
      username: this.inputs.read("username") || "",
      password: this.inputs.read("password") || "",
      connected: true,
    };
  }

  setup(ctx) {
    const { t } = this.useStore("language");
    const theme = this.useStore(ThemeStore);

    this.$$value.set(this.inputs.get("initialValue"));

    // How about this? useSomething() returns an API you can use to
    const { when, repeat } = this.useMarkup();
    const attrs = this.useAttributes();
    const state = this.useState();

    this.$$username.get();

    const $$username = state.writable("username");
    const $$password = state.writable("password");

    ctx.onConnect(() => {
      $$username.get();
    });

    const $$value = attrs.writable("username");

    const $$username = this.useState("username"); // Shorthand to get a writable.

    return (
      <div class={styles.container} style={theme.$cssVars}>
        <form class={styles.form} onsubmit={this.onSubmit}>
          <TextInput
            value={$$username}
            placeholder={t("login.usernamePlaceholder")}
            autofocus={true}
          />
          <TextInput
            value={$$password}
            placeholder={t("login.passwordPlaceholder")}
            type="password"
          />
          <button class={styles.button}>{t("login.buttonPlaceholder")}</button>
        </form>
      </div>
    );
  }

  onConnect() {
    this.log("LOGIN CONNECTING");
    this.useStore(LoaderStore).hideAppLoader();
  }

  onSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    const router = this.useStore("router");
    const auth = this.useStore(AuthStore);

    const state = this.useState();
    const username = state.read("username");
    const password = state.read("password");

    auth
      .logIn(username, password)
      .then(() => {
        router.navigate("/");
      })
      .catch((err) => {
        this.log(err);
      });
  };
}
```

## Naming

Thinking about putting everything under `@frameworke/*` with practical and descriptive names that end with a totally unnecessary `e`.

```js
import { App, Router, Store } from "@frameworke/backe";
import { App, View, Store } from "@frameworke/fronte";
import { Hash, List, Observable, StateMachine } from "@frameworke/bedrocke";

// Have build system be a weird little API like this if you import it.
import { Builder } from "@frameworke/builde";

const builder = new Builder({
  /* options */
});

const cancel = builder.watch((build) => {
  /* build in an object that contains the built project data to write. */

  build.writeToDisk(path); // Write to disk in a certain folder. Will ensure directory exists and is empty.
});

// Another way to call it:
const build = await builder.build();
build.writeToDisk(path);

await builder.build({ output: path });

// Inside of `./src/views/SomeView/SomeView.inspector.js`
import { Inspector } from "@frameworke/inspecte";

export default new Inspector(SomeView, {
  presets: [
    {
      name: "Example 1",
      about: "This is the first preset.",
      inputs: {
        example: "This is an attribute.",
        bound: new State(5),
      },
    },
  ],
});

// Don't know what this would be, but it's kind of funny that this already has a silent E.
// Maybe it could be different types of specialized caches (HTTPClientCache, credential/auth caches, etc.)
import { Cache } from "@frameworke/cache";
```

## Aesthetics

I'm struggling over whether it's a better idea to use classes or standalone functions. Standalone functions are more tree-shakeable and modular, but I feel like classes are easier to grasp conceptually, because all methods are grouped on one object, and the object itself aids understanding. A set of utility functions that happen to compose is a lot more abstract because the "object" is kind of imaginary in that scenario. This could just be in my mind and not really true for others.

On the other hand, my taste keeps shifting between which aesthetic I prefer. As I write this I'm leaning more toward the factory function style.

```js
const SomeView = makeView({
  inputs: {},
  setup(ctx, m) {
    const $$value = makeState(false);

    const $value = mergeStates($$one, $$two, (x, y) => x + y);

    return m("h1", $$value.readable());
  },
});

// vs:

const SomeView = new View({
  inputs: {},
  setup(ctx, m) {
    const $$value = new State(false);

    const $value = State.merge($$one, $$two, (x, y) => x + y);

    return m("h1", $$value.readable());
  },
});
```

If I went with factory functions over classes, the library's exports would look like this:

```js
import {
  makeApp,
  makeView,
  makeState,
  mergeStates,
  makeSpring,
} from "@frameworke/fronte";

import {
  makeList,
  makeHash,
  makeHTTPClient,
  makeObservable,
  makePerSecondQueue,
  makeRouter,
  makeStateMachine,

  // Type
  isNumber,
  assertNumber,
  isObject,
  assertObject,
  isArray,
  assertArray,
  isArrayOf,
  assertArrayOf,
  /* ... */
} from "@frameworke/bedrocke";

// Or make type its own library

import {
  isNumber,
  assertNumber,
  isObject,
  assertObject,
  isArray,
  assertArray,
  isArrayOf,
  assertArrayOf,
  /* ... */
} from "@frameworke/type";

// Which can still be imported as one:

import * as Type from "@frameworke/type";
```

Classes are a nice, uniform abstraction though. Every programmer should already understand how a class, instances of a class, static methods, etc. work through experience. Functions can take anything and return anything, so the freeform nature could make them less intuitive when trying to figure out the structure of a program.

Classes are also used heavily in the JS standard library. Also you can extend built-in types through classes. Leaning into classes would be a good thing if I want the framework to feel like natural JS.

```js
const arr = new Array(); // instantiation
Array.isArray([]); // static methods

const map = new Map(); // new types are implemented as classes
```

## Thoughts

```js
// Creates a type (schema in Zod terms) to validate objects.
const record = new Type({
  id: Type.isNumber,
  value: Type.isString,
});

// Result here is true because the object shape matches
const result = record.isTypeOf({
  id: 1,
  value: "testing type matching",
});

// Can take a function if an object shape doesn't fit the bill.
const func = new Type(Type.isFunction);
func.isTypeOf(() => {});
```

###

```js
import { Builder } from "@borf/build";

export default Builder.define({
  client: {
    entry: "./client/client.js",
    gzip: true,
  },
  server: {
    entry: "./server/server.js",
  },
});
```

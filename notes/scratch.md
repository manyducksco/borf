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

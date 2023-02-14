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

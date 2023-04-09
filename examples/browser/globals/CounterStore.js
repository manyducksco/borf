import { Store, Writable } from "@borf/browser";

export const CounterStore = new Store({
  label: "CounterStore",
  about: "Keeps a counter that auto-increments each second.",

  setup: (ctx) => {
    const $$current = new Writable(0);

    ctx.onConnect(() => {
      setInterval(() => {
        $$current.update((x) => x + 1);
      }, 1000);
    });

    return {
      $current: $$current.toReadable(),
      reset() {
        $$current.set(0);
      },
    };
  },
});

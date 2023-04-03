import { Store, Writable } from "@borf/browser";

export const CounterStore = Store.define({
  label: "CounterStore",
  about: "Keeps a counter that auto-increments each second.",
  inputs: {
    title: {
      example: "test", // Infer type from example
      default: "The Title",
    },
    // cat: {
    //   example: { id: 5, name: "Bon", color: "#555" },
    //   default: null,
    // },
  },
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

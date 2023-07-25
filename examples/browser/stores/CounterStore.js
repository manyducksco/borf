import { Writable } from "@borf/browser";

/**
 * Keeps a counter that auto-increments each second.
 */
export function CounterStore(c) {
  const $$current = new Writable(0);

  c.onConnected(() => {
    setInterval(() => {
      $$current.update((x) => x + 1);
    }, 1000);
  });

  return {
    $current: $$current.toReadable(),
    reset() {
      $$current.value = 0;
    },
  };
}

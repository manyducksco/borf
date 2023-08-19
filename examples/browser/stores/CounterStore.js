import { readable, writable } from "@borf/browser";

/**
 * Keeps a counter that auto-increments each second.
 */
export function CounterStore(c) {
  const $$current = writable(0);

  c.onConnected(() => {
    setInterval(() => {
      $$current.update((x) => x + 1);
    }, 1000);
  });

  return {
    $current: readable($$current),
    reset() {
      $$current.set(0);
    },
  };
}

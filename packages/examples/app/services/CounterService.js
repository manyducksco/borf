import { makeService, makeState } from "@woofjs/app";

/**
 * Exposes a $current value and increments it by one each second.
 */
const CounterService = makeService((self) => {
  const $current = makeState(0);

  self.connected(() => {
    setInterval(() => {
      $current.set((current) => current + 1);
    }, 1000);
  });

  return {
    $current,

    reset() {
      $current.set(0);
    },
  };
});

export default CounterService;

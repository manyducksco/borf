import { makeService, makeState } from "@woofjs/client";

/**
 * Exposes a $current value and increments it by one each second.
 */
export default makeService(function CounterService() {
  const $current = makeState(0);

  this.afterConnect(() => {
    console.log($current.get());

    setInterval(() => {
      $current.set((current) => current + 1);
      console.log($current.get());
    }, 1000);
  });

  return {
    $current,

    reset() {
      $current.set(0);
    },
  };
});

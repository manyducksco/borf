import { Global, makeState } from "woofe";

export class CounterGlobal extends Global {
  static about =
    "Exposes a $current value and increments it by one each second.";

  setup(ctx) {
    const $$current = makeState(0);

    ctx.afterConnect(() => {
      setInterval(() => {
        $$current.update((x) => x + 1);
      }, 1000);
    });

    return {
      $current: $$current.readable(),
      reset() {
        $$current.set(0);
      },
    };
  }
}

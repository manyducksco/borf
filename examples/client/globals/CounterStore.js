import { Store, State } from "woofe";

export class CounterStore extends Store {
  static about = "Keeps a counter that increments by one each second.";

  setup(ctx) {
    const $$current = new State(0);

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

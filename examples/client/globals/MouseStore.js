import { Store, makeState } from "woofe";

export class MouseStore extends Store {
  static about = "Keeps the current mouse position.";

  setup(ctx) {
    const $$position = makeState({ x: 0, y: 0 });

    ctx.afterConnect(() => {
      ctx.log("listening for mousemove events");

      window.addEventListener("mousemove", (e) => {
        $$position.set({ x: e.clientX, y: e.clientY });
      });
    });

    return {
      $position: $$position.readable(),
    };
  }
}

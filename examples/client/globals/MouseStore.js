import { Store, State } from "woofe";

export class MouseStore extends Store {
  static about = "Keeps the current mouse position.";

  setup(ctx) {
    const $$position = new State({ x: 0, y: 0 });

    ctx.onConnect(() => {
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

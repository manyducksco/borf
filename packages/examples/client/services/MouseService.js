import { makeService, makeState } from "@woofjs/client";

const MouseService = makeService((self) => {
  const $position = makeState({ x: 0, y: 0 });

  self.afterConnect(() => {
    self.debug.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      $position.set({
        x: e.clientX,
        y: e.clientY,
      });
    });
  });

  return {
    $position,
  };
});

export default MouseService;

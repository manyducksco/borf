import { makeService, makeState } from "@woofjs/app";

const MouseService = makeService((self) => {
  const $position = makeState({ x: 0, y: 0 });

  self.connected(() => {
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

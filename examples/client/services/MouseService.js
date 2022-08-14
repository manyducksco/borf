import { State, Service } from "@woofjs/client";

export default new Service(function MouseService() {
  const $position = new State({ x: 0, y: 0 });

  this.afterConnect(() => {
    this.debug.log("listening for mousemove events");

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

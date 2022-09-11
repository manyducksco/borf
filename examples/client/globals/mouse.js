export default function mouse() {
  this.defaultState = {
    position: { x: 0, y: 0 },
  };

  this.afterConnect(() => {
    this.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      this.set("position", {
        x: e.clientX,
        y: e.clientY,
      });
    });
  });

  return {
    $position: this.read("position"),
  };
}

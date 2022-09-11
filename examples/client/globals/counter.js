/**
 * Exposes a $current value and increments it by one each second.
 */
export default function counter() {
  this.defaultState = {
    current: 0,
  };

  this.afterConnect(() => {
    setInterval(() => {
      this.set("current", (x) => x + 1);
    }, 1000);
  });

  return {
    $current: this.read("current"),

    reset: () => {
      this.set("current", 0);
    },
  };
}

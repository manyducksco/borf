export function parseCombo(combo) {
  return combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .sort();
}

const cancellers = [];

export const Keys = {
  onDown(combo, handler) {},

  onUp(combo, handler) {},

  createLayer() {
    return new KeyLayer();
  },
};

const keyAlias = {
  arrowup: "up",
  arrowdown: "down",
  arrowright: "right",
  arrowleft: "left",
  " ": "space",
};

class KeyLayer {
  #cancellers = [];
  #bindings = [];
  #keysDown = new Set();
  #upHandlerFired = false;

  onUp(combo, handler) {
    this.#bindings.push({
      hash: parseCombo(combo).join("+"),
      event: "keyup",
      handler,
    });

    return this;
  }

  onDown(combo, handler) {
    this.#bindings.push({
      hash: parseCombo(combo).join("+"),
      event: "keydown",
      handler,
    });

    return this;
  }

  bind() {
    const handleDown = (e) => {
      let key = e.key.toLowerCase();
      key = keyAlias[key] || key;

      this.#keysDown.add(key);

      const pressed = Array.from(this.#keysDown).sort().join("+");
      const binding = this.#bindings.find(
        (b) => b.event === "keydown" && b.hash === pressed
      );

      if (binding) {
        e.preventDefault();
        binding.handler();
      }
    };

    const handleUp = (e) => {
      let key = e.key.toLowerCase();
      key = keyAlias[key] || key;

      const pressed = Array.from(this.#keysDown).sort().join("+");
      console.log(pressed);
      const binding = this.#bindings.find(
        (b) => b.event === "keyup" && b.hash === pressed
      );

      this.#keysDown.delete(key);

      if (this.#keysDown.size === 0) {
        this.#upHandlerFired = false;
      }

      if (binding) {
        this.#upHandlerFired = true;
        e.preventDefault();
        binding.handler();
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    this.#cancellers.push(() => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    });
  }

  unbind() {
    for (const cancel of this.#cancellers) {
      cancel();
    }
  }
}

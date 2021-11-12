const keyAlias = {
  arrowup: "up",
  arrowdown: "down",
  arrowright: "right",
  arrowleft: "left",
  " ": "space",
};

export class KeySet {
  #cancellers = [];
  #bindings = [];
  #keysDown = new Set();

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
      const bound = this.#bindings.find(
        (b) => b.event === "keydown" && b.hash === pressed
      );

      if (bound) {
        e.preventDefault();
        bound.handler();
      }
    };

    const handleUp = (e) => {
      let key = e.key.toLowerCase();
      key = keyAlias[key] || key;

      const pressed = Array.from(this.#keysDown).sort().join("+");
      const bound = this.#bindings.find(
        (b) => b.event === "keyup" && b.hash === pressed
      );

      this.#keysDown.delete(key);

      if (bound) {
        e.preventDefault();
        bound.handler();
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    this.#cancellers.push(() => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    });

    return this;
  }

  unbind() {
    for (const cancel of this.#cancellers) {
      cancel();
    }

    return this;
  }
}

export const Keyboard = new KeySet().bind();

function parseCombo(combo) {
  return combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .sort();
}

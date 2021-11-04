import { parseCombo } from "./parseCombo";

const cancellers: Array<() => void> = [];

export const Keys = {
  onDown(combo: string, handler: (e: KeyboardEvent) => void) {},

  onUp(combo: string, handler: (e: KeyboardEvent) => void) {},

  createLayer() {
    return new KeyLayer();
  },
};

type KeyBinding = {
  event: "keyup" | "keydown";
  hash: string;
  handler: () => void;
};

const keyAlias: { [key: string]: string } = {
  arrowup: "up",
  arrowdown: "down",
  arrowright: "right",
  arrowleft: "left",
  " ": "space",
};

class KeyLayer {
  private cancellers: Array<() => void> = [];
  private bindings: KeyBinding[] = [];
  private keysDown = new Set<string>();
  private upHandlerFired = false;

  onUp(combo: string, handler: () => void) {
    this.bindings.push({
      hash: parseCombo(combo).join("+"),
      event: "keyup",
      handler,
    });

    return this;
  }

  onDown(combo: string, handler: () => void) {
    this.bindings.push({
      hash: parseCombo(combo).join("+"),
      event: "keydown",
      handler,
    });

    return this;
  }

  bind() {
    const handleDown = (e: KeyboardEvent) => {
      let key = e.key.toLowerCase();
      key = keyAlias[key] || key;

      this.keysDown.add(key);

      const pressed = Array.from(this.keysDown).sort().join("+");
      const binding = this.bindings.find(
        (b) => b.event === "keydown" && b.hash === pressed
      );

      if (binding) {
        e.preventDefault();
        binding.handler();
      }
    };

    const handleUp = (e: KeyboardEvent) => {
      let key = e.key.toLowerCase();
      key = keyAlias[key] || key;

      const pressed = Array.from(this.keysDown).sort().join("+");
      console.log(pressed);
      const binding = this.bindings.find(
        (b) => b.event === "keyup" && b.hash === pressed
      );

      this.keysDown.delete(key);

      if (this.keysDown.size === 0) {
        this.upHandlerFired = false;
      }

      if (binding) {
        this.upHandlerFired = true;
        e.preventDefault();
        binding.handler();
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    cancellers.push(() => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    });
  }

  unbind() {
    for (const cancel of this.cancellers) {
      cancel();
    }
  }
}

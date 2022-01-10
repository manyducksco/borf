import ColorHash from "color-hash"; // TODO: Remove this dependency - it's too big for what we need it for

export function makeConsoleReceiver() {
  const hash = new ColorHash({
    lightness: [0.6, 0.7],
    saturation: [0.6, 0.7],
  });

  return {
    receive(name, level, ...args) {
      if (level === "error") {
        console.error(`%c[${name}]`, `color:${hash.hex(name)};font-weight:bold`, ...args);
      } else if (level === "warn") {
        console.warn(`%c[${name}]`, `color:${hash.hex(name)};font-weight:bold`, ...args);
      } else {
        console.log(`%c[${name}]`, `color:${hash.hex(name)};font-weight:bold`, ...args);
      }
    },
  };
}

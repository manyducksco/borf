import { readable, writable } from "@borf/browser";

/**
 * Tracks the mouse position.
 */
export function MouseStore(c) {
  const $$position = writable({ x: 0, y: 0 });

  c.onConnected(() => {
    c.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      $$position.set({ x: e.clientX, y: e.clientY });
    });
  });

  return {
    $position: readable($$position),
  };
}

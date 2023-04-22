import { Writable } from "@borf/browser";

/**
 * Tracks the mouse position.
 */
export function MouseStore(self) {
  const $$position = new Writable({ x: 0, y: 0 });

  self.onConnected(() => {
    self.debug.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      $$position.set({ x: e.clientX, y: e.clientY });
    });
  });

  return {
    $position: $$position.toReadable(),
  };
}

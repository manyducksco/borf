import { Writable } from "@borf/browser";

/**
 * Tracks the mouse position.
 */
export function MouseStore(_, ctx) {
  const $$position = new Writable({ x: 0, y: 0 });

  ctx.onConnected(() => {
    ctx.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      $$position.value = { x: e.clientX, y: e.clientY };
    });
  });

  return {
    $position: $$position.toReadable(),
  };
}

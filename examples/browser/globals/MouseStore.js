import { Writable, useConnected, useConsole } from "@borf/browser";

/**
 * Tracks the mouse position.
 */
export function MouseStore() {
  const console = useConsole();
  const $$position = new Writable({ x: 0, y: 0 });

  useConnected(() => {
    console.log("listening for mousemove events");

    window.addEventListener("mousemove", (e) => {
      $$position.set({ x: e.clientX, y: e.clientY });
    });
  });

  return {
    $position: $$position.toReadable(),
  };
}

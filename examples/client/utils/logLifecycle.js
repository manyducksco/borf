/**
 * Logs lifecycle hooks of a component for debugging/learning purposes.
 *
 * @param ctx - Component context object
 */
export default function logLifecycle(ctx) {
  ctx.onConnect(() => {
    ctx.log("lifecycle: connect");
  });

  ctx.onDisconnect(() => {
    ctx.log("lifecycle: disconnect");
  });
}

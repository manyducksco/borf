/**
 * Logs lifecycle hooks of a component for debugging/learning purposes.
 *
 * @param ctx - Component context object
 */
export default function logLifecycle(ctx) {
  ctx.beforeConnect(() => {
    ctx.debug.log("lifecycle: beforeConnect");
  });

  ctx.afterConnect(() => {
    ctx.debug.log("lifecycle: afterConnect");
  });

  ctx.beforeDisconnect(() => {
    ctx.debug.log("lifecycle: beforeDisconnect");
  });

  ctx.afterDisconnect(() => {
    ctx.debug.log("lifecycle: afterDisconnect");
  });
}

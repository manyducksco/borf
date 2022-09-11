/**
 * Logs lifecycle hooks of a component for debugging/learning purposes.
 *
 * @param ctx - Component context object
 */
export default function logLifecycle(ctx) {
  ctx.beforeConnect(() => {
    ctx.log("lifecycle: beforeConnect");
  });

  ctx.afterConnect(() => {
    ctx.log("lifecycle: afterConnect");
  });

  ctx.beforeDisconnect(() => {
    ctx.log("lifecycle: beforeDisconnect");
  });

  ctx.afterDisconnect(() => {
    ctx.log("lifecycle: afterDisconnect");
  });
}

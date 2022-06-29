/**
 * Logs lifecycle hooks of a component for debugging/learning purposes.
 */
export default function logLifecycle(self) {
  self.beforeConnect(() => {
    self.debug.log("lifecycle: beforeConnect");
  });

  self.afterConnect(() => {
    self.debug.log("lifecycle: afterConnect");
  });

  self.beforeDisconnect(() => {
    self.debug.log("lifecycle: beforeDisconnect");
  });

  self.afterDisconnect(() => {
    self.debug.log("lifecycle: afterDisconnect");
  });
}

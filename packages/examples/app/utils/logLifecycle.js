/**
 * Logs lifecycle hooks of a component for debugging/learning purposes.
 */
export default function logLifecycle(self) {
  self.beforeConnect(() => {
    self.debug.log("lifecycle: beforeConnect");
  });

  self.connected(() => {
    self.debug.log("lifecycle: connected");
  });

  self.beforeDisconnect(() => {
    self.debug.log("lifecycle: beforeDisconnect");
  });

  self.disconnected(() => {
    self.debug.log("lifecycle: disconnected");
  });
}

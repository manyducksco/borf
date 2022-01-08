import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";

/**
 * Debug logging service used internally and exposed for use in apps.
 */
const DebugService = makeService((self) => {
  return self.options.debug;
});

export default DebugService;

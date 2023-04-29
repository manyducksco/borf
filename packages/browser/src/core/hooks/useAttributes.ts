import { getCurrentComponent } from "../keys.js";
import { useConsole } from "./useConsole.js";

interface UseAttributesOptions<I> {}

/**
 * Access attributes passed to this component.
 */
export function useAttributes<I = unknown>(options?: UseAttributesOptions<I>) {
  const core = getCurrentComponent<I>();

  return {
    $: core.inputs.$.bind(core.inputs) as typeof core.inputs.$,
    $$: core.inputs.$$.bind(core.inputs) as typeof core.inputs.$$,
    get: core.inputs.get.bind(core.inputs) as typeof core.inputs.get,
    set: core.inputs.set.bind(core.inputs) as typeof core.inputs.set,
    update: core.inputs.update.bind(core.inputs) as typeof core.inputs.update,
  };
}

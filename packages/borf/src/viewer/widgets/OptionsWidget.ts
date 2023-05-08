import { Widget } from "../Widget.js";

interface OptionsWidgetOptions<T> {
  options: T[];
}

/**
 * A widget that allows the user to select one of several preset values for an attribute.
 */
export class OptionsWidget<T> extends Widget {
  constructor(initialValue: T, options: OptionsWidgetOptions<T>) {
    super();
  }
}

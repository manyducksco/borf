interface PresetOptions {
  describe?: string;
  stores?: unknown[];
  attributes?: {};
}

interface PresetRegistration {
  name: string;
  options: PresetOptions;
}

// NOTE: Viewer runs inside the frame.
export class Viewer {
  _component: unknown;
  _presets: PresetRegistration[] = [];

  constructor(component: unknown) {
    this._component = component;
  }

  /**
   * Adds a new preset to this viewer. Presets are snapshots that describe a state of the component.
   */
  preset(name: string, options: PresetOptions) {
    const current = this._presets.find((p) => p.name === name);

    // Names must be unique. Overwrite previous options if same name passed.
    if (current) {
      current.options = options;
    } else {
      this._presets.push({ name, options });
    }
  }

  /**
   * Creates a new instance of `presetName`.
   */
  _init(presetName: string) {}
}

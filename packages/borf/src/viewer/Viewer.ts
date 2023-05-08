interface PresetOptions {
  describe?: string;
  stores?: unknown[];
  attributes?: {};
}

export class Viewer {
  constructor(component: unknown) {}

  addPreset(name: string, options: PresetOptions) {}
}

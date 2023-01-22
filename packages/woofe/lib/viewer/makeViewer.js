import { ViewBlueprint } from "../blueprints/View.js";

export function makeViewer(view, config = {}) {
  return new Viewer(view, config);
}

class Viewer {
  isConnected = false;

  constructor(view, config = {}) {
    if (view.isBlueprint) {
      this.blueprint = view;
    } else {
      this.blueprint = new ViewBlueprint(view);
    }

    this.config = {
      globals: config.globals || [],
      locals: config.locals || [],
      attributes: config.attributes || {},
    };
  }

  async connect(parent, preset = null) {
    // Take values from top level config first.
    let globals = [...this.config.globals];
    let locals = [...this.config.locals];
    let attributes = { ...this.config.attributes };

    // Merge in values from preset.
    if (preset) {
      const data = this.config.presets?.find((x) => x.name === preset);

      if (!data) {
        throw new Error(`Unknown viewer preset '${preset}'.`);
      }

      if (data.attributes) {
        Object.assign(attributes, data.attributes);
      }

      if (data.globals) {
        for (const { name, global } of data.globals) {
          const index = globals.findIndex((x) => x.name === name);

          if (index > -1) {
            globals.splice(index, 1, { name, global });
          } else {
            globals.push({ name, global });
          }
        }
      }

      if (data.locals) {
        for (const { name, local } of data.globals) {
          const index = locals.findIndex((x) => x.name === name);

          if (index > -1) {
            locals.splice(index, 1, { name, local });
          } else {
            locals.push({ name, local });
          }
        }
      }
    }

    // Disconnect old viewer content, if any.
    if (this.isConnected) {
      await this.disconnect();
    }

    const appContext = {
      globals: {},
    };

    const elementContext = {
      locals: {},
    };

    // TODO: Initialize globals
    for (const { name, global } of globals) {
    }

    // TODO: Initialize locals
    for (const { name, local } of locals) {
    }

    // TODO: Create and connect view.
    const view = this.blueprint.build({
      appContext,
      elementContext,
      attributes,
    });

    await view.connect(parent);

    this.current = {
      appContext,
      elementContext,
      view,
    };

    this.isConnected = true;
  }

  async disconnect() {
    if (this.isConnected) {
      const { appContext, elementContext, view } = this.current;

      for (const name in elementContext.locals) {
        await elementContext.locals[name].beforeDisconnect();
      }

      view.disconnect();

      for (const name in elementContext.locals) {
        await elementContext.locals[name].afterDisconnect();
      }

      for (const name in appContext.globals) {
        await appContext.globals[name].beforeDisconnect();
        await appContext.globals[name].afterDisconnect();
      }

      this.isConnected = false;
    }
  }
}

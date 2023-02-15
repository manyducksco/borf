import { View } from "./View.js";
import { Markup } from "./Markup.js";

/**
 * Collects errors and unmounts the app if necessary.
 */
export class CrashCollector {
  #errors = [];
  #disconnectApp; // Callback to disconnect the app.
  #connectView;
  #enableCrashPage; // Whether to show a crash page or just unmount to a white screen.
  #crashPage = DefaultCrashPage;

  #isCrashed = false;

  constructor({ disconnectApp, connectView, crashPage, enableCrashPage = true }) {
    this.#disconnectApp = disconnectApp;
    this.#connectView = connectView;
    this.#enableCrashPage = enableCrashPage;

    if (crashPage) {
      this.setCrashPage(crashPage);
    }
  }

  setCrashPage(view) {
    if (!View.isView(view)) {
      throw new TypeError(`Expected a view. Got: ${view}`);
    }

    this.#crashPage = view;
  }

  crash({ error, component }) {
    // Crash the entire app, unmounting everything and displaying an error page.
    this.#errors.push({ error, severity: "crash" });

    // The app can only be disconnected once.
    if (this.#isCrashed) return;

    this.#disconnectApp();

    if (this.#enableCrashPage) {
      const markup = new Markup((config) => {
        return new this.#crashPage({
          ...config,
          channelPrefix: "crash",
          label: this.#crashPage.label || this.#crashPage.name,
          about: this.#crashPage.about,
          inputs: {
            message: error.message,
            error: error,
            componentName: component.label,
          },
          inputDefs: this.#crashPage.inputs,
        });
      });
      this.#connectView(markup);
    }

    this.#isCrashed = true;

    throw error;
  }

  report(error) {
    // Report an error without crashing the entire app.
    this.#errors.push({ error, severity: "report" });
  }
}

class DefaultCrashPage extends View {
  setup(ctx, m) {
    const { message } = ctx.inputs.get();

    return m("div", { style: { backgroundColor: "#880000", color: "#fff", padding: "2rem" } }, [
      m("h1", "IT'S DEAD, JIM"),
      m("p", message),
    ]);
  }
}

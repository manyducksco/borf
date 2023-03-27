import { View } from "./View.js";
import { Store } from "./Store.js";
import { Markup } from "./Markup.js";

/**
 * Options passed when creating a new CrashCollector.
 */
type CrashCollectorOptions = {
  disconnectApp: () => void;
  connectView: (markup: Markup) => void;
  crashPage?: any;
  enableCrashPage?: boolean;
};

type ErrorReport = {
  error: Error;
  severity: "report" | "crash";
};

type CrashOptions = {
  error: Error;
  component: View<any> | Store<any, any>;
};

/**
 * Collects errors and unmounts the app if necessary.
 */
export class CrashCollector {
  #errors: ErrorReport[] = [];
  #disconnectApp; // Callback to disconnect the app.
  #connectView;
  #enableCrashPage; // Whether to show a crash page or just unmount to a white screen.
  #crashPage: any = DefaultCrashPage;

  #isCrashed = false;

  constructor({ disconnectApp, connectView, crashPage, enableCrashPage = true }: CrashCollectorOptions) {
    this.#disconnectApp = disconnectApp;
    this.#connectView = connectView;
    this.#enableCrashPage = enableCrashPage;

    if (crashPage) {
      this.setCrashPage(crashPage);
    }
  }

  setCrashPage(view: View) {
    if (!View.isView(view)) {
      throw new TypeError(`Expected a view. Got: ${view}`);
    }

    this.#crashPage = view;
  }

  crash({ error, component }: CrashOptions) {
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

  report(error: Error) {
    // Report an error without crashing the entire app.
    this.#errors.push({ error, severity: "report" });
  }
}

const DefaultCrashPage = View.define({
  label: "DefaultCrashPage",
  setup(ctx, m) {
    const { message, error, componentName } = ctx.inputs.get();

    return m(
      "div",
      {
        style: {
          backgroundColor: "#880000",
          color: "#fff",
          padding: "2rem",
          position: "fixed",
          inset: 0,
          fontSize: "20px",
        },
      },
      [
        m("h1", { style: { marginBottom: "0.5rem" } }, "The app has crashed"),

        m(
          "p",
          { style: { marginBottom: "0.25rem" } },
          m("span", { style: { fontFamily: "monospace" } }, componentName),
          " says:"
        ),

        m(
          "blockquote",
          {
            style: {
              backgroundColor: "#991111",
              padding: "0.25em",
              borderRadius: "6px",
              fontFamily: "monospace",
              marginBottom: "1rem",
            },
          },
          m(
            "span",
            {
              style: {
                display: "inline-block",
                backgroundColor: "red",
                padding: "0.1em 0.4em",
                marginRight: "0.5em",
                borderRadius: "4px",
                fontSize: "0.9em",
                fontWeight: "bold",
              },
            },
            error.name
          ),
          message
        ),

        m("p", "Please see the browser console for details."),
      ]
    );
  },
});

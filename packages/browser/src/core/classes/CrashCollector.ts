import { View } from "./View.js";
import { Store } from "./Store.js";

// ----- Types ----- //

type ErrorContext = {
  error: Error;
  severity: "error" | "crash";

  /**
   * Label for the component where the error occurred.
   */
  componentLabel: string;
};

type CrashOptions = {
  error: Error;
  component: View<any> | Store<any, any>;
};

type ErrorCallback = (ctx: ErrorContext) => void;

// ----- Code ----- //

/**
 * Receives errors that occur in components.
 */
export class CrashCollector {
  #errors: ErrorContext[] = [];
  #errorCallbacks: ErrorCallback[] = [];

  onError(callback: ErrorCallback) {
    this.#errorCallbacks.push(callback);

    return () => {
      this.#errorCallbacks = this.#errorCallbacks.filter((x) => x !== callback);
    };
  }

  /**
   * Reports an unrecoverable error that requires crashing the whole app.
   */
  crash({ error, component }: CrashOptions) {
    const ctx: ErrorContext = {
      error,
      severity: "crash",
      componentLabel: getComponentLabel(component),
    };

    this.#errors.push(ctx);
    for (const callback of this.#errorCallbacks) {
      callback(ctx);
    }

    throw error; // Throws the error so developer can work with the stack trace in the console.
  }

  /**
   * Reports a recoverable error.
   */
  error({ error, component }: CrashOptions) {
    const ctx: ErrorContext = {
      error,
      severity: "error",
      componentLabel: getComponentLabel(component),
    };

    this.#errors.push(ctx);
    for (const callback of this.#errorCallbacks) {
      callback(ctx);
    }
  }
}

const getComponentLabel = (component: View<any> | Store<any, any>) =>
  View.isView(component) ? "anonymous view" : Store.isStore(component) ? "anonymous store" : "anonymous component";

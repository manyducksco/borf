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

  /**
   * Registers a callback to receive all errors that pass through the CrashCollector.
   * Returns a function that cancels this listener when called.
   */
  onError(callback: ErrorCallback) {
    this.#errorCallbacks.push(callback);

    return () => {
      this.#errorCallbacks.splice(this.#errorCallbacks.indexOf(callback), 1);
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

function getComponentLabel(component: View<any> | Store<any, any>) {
  if (View.isView(component)) {
    return component.label ?? "anonymous view";
  }

  if (Store.isStore(component)) {
    return component.label ?? "anonymous store";
  }

  return "anonymous component";
}

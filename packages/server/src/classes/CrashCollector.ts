interface ErrorEntry {
  error: Error;
  severity: "crash" | "report";
  label?: string;
}

interface CrashCollectorOptions {
  onCrash: (entry: ErrorEntry) => void;
  onReport?: (entry: ErrorEntry) => void;
  sendStackTrace?: boolean | "development";
}

interface ReportDetails {
  error: Error;
  label?: string;
}

/**
 * Collects errors and unmounts the app if necessary.
 */
export class CrashCollector {
  #errors: ErrorEntry[] = [];
  #onCrash;
  #onReport;
  #sendStackTrace;

  #isCrashed = false;

  constructor({ onCrash, onReport, sendStackTrace = "development" }: CrashCollectorOptions) {
    this.#onCrash = onCrash;
    this.#onReport = onReport;
    this.#sendStackTrace = sendStackTrace;
  }

  crash({ error, label }: ReportDetails) {
    // Crash the request and return an error message.
    const entry: ErrorEntry = { error, label, severity: "crash" };
    this.#errors.push(entry);

    // The app can only be disconnected once.
    if (this.#isCrashed) return;

    this.#onCrash(entry);
    this.#isCrashed = true;

    throw error;
  }

  report({ error, label }: ReportDetails) {
    // Report an error without crashing.
    const entry: ErrorEntry = { error, label, severity: "report" };
    this.#errors.push(entry);

    if (this.#onReport) {
      this.#onReport(entry);
    }
  }
}

/**
 * The environment name that this copy of `@borf/browser` is running in.
 */
export const BORF_ENV: "development" | "production" =
  process?.env?.NODE_ENV === "development" || (window as any)?.BORF_ENV === "development"
    ? "development"
    : "production";

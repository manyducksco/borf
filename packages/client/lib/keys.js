// In this file are symbol keys for accessing internal state on objects that are otherwise exposed to the end user.
// These symbols are not exported, so these properties are not accessible to any code running outside of this library.

export const __appContext = Symbol("appContext");
export const __elementContext = Symbol("elementContext");

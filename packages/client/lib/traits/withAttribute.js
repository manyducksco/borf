export function withAttribute(name, options) {
  return {
    ...options,
    name,
    _trait: "attribute",
  };
}

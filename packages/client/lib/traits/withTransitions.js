export function withTransitions(transitions, mapToCSS) {
  return {
    _trait: "transitions",
    create: transitions,
    mapToCSS,
  };
}

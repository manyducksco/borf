export function niceTime(milliseconds) {
  if (milliseconds > 1000) {
    return (milliseconds / 1000).toFixed(1) + "s";
  }

  return milliseconds + "ms";
}

export function makeTimer() {
  let started = performance.now();

  return function end() {
    const ms = performance.now() - started;

    if (ms < 1) {
      return Math.round(ms * 1000) + "µs";
    }

    if (ms < 1000) {
      return Math.round(ms) + "ms";
    }

    return (ms / 1000).toFixed(1) + "s";
  };
}

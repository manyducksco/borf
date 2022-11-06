export function makeRef(initialValue) {
  let currentValue = initialValue;

  return function (newValue) {
    if (newValue === undefined) {
      return currentValue;
    }

    currentValue = newValue;
  }
}
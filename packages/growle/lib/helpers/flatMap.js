export function flatMap(arr) {
  const flattened = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      flattened.push(...flatMap(item));
    } else {
      flattened.push(item);
    }
  }

  return flattened;
}

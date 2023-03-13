/**
 * Returns a promise that resolves after a number of `milliseconds`.
 */
export async function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

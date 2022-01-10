/**
 * Joins multiple URL path fragments into a single string.
 *
 * @param parts - One or more URL fragments (e.g. `["api", "users", 5]`)
 * @returns a joined path (e.g. `"api/users/5"`)
 */
export function joinPath(...parts) {
  parts = parts.filter((x) => x);

  let joined = parts.shift();

  if (joined) {
    for (const part of parts) {
      if (joined[joined.length - 1] !== "/") {
        if (part[0] !== "/") {
          joined += "/" + part;
        } else {
          joined += part;
        }
      }
    }
  }

  return joined ?? "";
}

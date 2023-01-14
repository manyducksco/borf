/**
 * Joins multiple URL path fragments into a single string.
 *
 * @param parts - One or more URL fragments (e.g. `["api", "users", 5]`)
 * @returns a joined path (e.g. `"api/users/5"`)
 */
export function joinPath(...parts) {
  parts = parts.filter((x) => x).map(String);

  let joined = parts.shift();

  if (joined) {
    for (const part of parts) {
      if (part.startsWith(".")) {
        // Resolve relative path against joined
        joined = resolve(joined, part);
      } else if (joined[joined.length - 1] !== "/") {
        if (part[0] !== "/") {
          joined += "/" + part;
        } else {
          joined += part;
        }
      } else {
        if (part[0] === "/") {
          joined += part.slice(1);
        } else {
          joined += part;
        }
      }
    }

    // Remove trailing slash (unless path is just '/')
    if (joined !== "/" && joined.endsWith("/")) {
      joined = joined.slice(0, joined.length - 1);
    }
  }

  return joined ?? "";
}

export function resolve(base, part) {
  let resolved = base;

  while (true) {
    if (part.startsWith("..")) {
      for (let i = resolved.length; i > 0; --i) {
        if (resolved[i] === "/" || i === 0) {
          resolved = resolved.slice(0, i);
          part = part.replace(/^\.\.\/?/, "");
          break;
        }
      }
    } else if (part.startsWith(".")) {
      part = part.replace(/^\.\/?/, "");
    } else {
      break;
    }
  }

  return joinPath(resolved, part);
}

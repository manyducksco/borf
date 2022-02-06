import { joinPath } from "./joinPath";

/**
 * Resolves relative route paths against a base, handling './' and '../' style navigation.
 */
export function resolvePath(current, target) {
  if (target.startsWith("/")) {
    return target;
  }

  let resolved = current;

  while (true) {
    if (target.startsWith("..")) {
      for (let i = resolved.length; i > 0; --i) {
        if (resolved[i] === "/" || i === 0) {
          resolved = resolved.slice(0, i);
          target = target.replace(/^\.\.\/?/, "");
          break;
        }
      }
    } else if (target.startsWith(".")) {
      target = target.replace(/^\.\/?/, "");
    } else {
      break;
    }
  }

  return joinPath(resolved, target);
}

const safeExternalLink = /(noopener|noreferrer) (noopener|noreferrer)/;
const protocolLink = /^[\w-_]+:/;

/**
 * Intercepts links within the root node.
 *
 * This is adapted from https://github.com/choojs/nanohref/blob/master/index.js
 *
 * @param root - Element under which to intercept link clicks
 * @param callback - Function to call when a click event is intercepted
 * @param _window - (optional) Override for global window object
 */
export function catchLinks(root: HTMLElement, callback: (anchor: HTMLAnchorElement) => void, _window = window) {
  function traverse(node: HTMLElement | null): HTMLAnchorElement | null {
    if (!node || node === root) {
      return null;
    }

    if (node.localName !== "a" || (node as any).href === undefined) {
      return traverse(node.parentNode as HTMLElement | null);
    }

    return node as HTMLAnchorElement;
  }

  function handler(e: MouseEvent) {
    if ((e.button && e.button !== 0) || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) {
      return;
    }

    const anchor = traverse(e.target as HTMLElement);

    if (!anchor) {
      return;
    }

    if (
      _window.location.protocol !== anchor.protocol ||
      _window.location.hostname !== anchor.hostname ||
      _window.location.port !== anchor.port ||
      anchor.hasAttribute("data-router-ignore") ||
      anchor.hasAttribute("download") ||
      (anchor.getAttribute("target") === "_blank" && safeExternalLink.test(anchor.getAttribute("rel")!)) ||
      protocolLink.test(anchor.getAttribute("href")!)
    ) {
      return;
    }

    e.preventDefault();
    callback(anchor);
  }

  root.addEventListener("click", handler);

  return function cancel() {
    root.removeEventListener("click", handler);
  };
}

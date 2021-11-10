const safeExternalLink = /(noopener|noreferrer) (noopener|noreferrer)/;
const protocolLink = /^[\w-_]+:/;

type LinkCallback = (element: HTMLAnchorElement) => void;

/**
 * Intercepts links within the root node.
 *
 * This is adapted from https://github.com/choojs/nanohref/blob/master/index.js
 *
 * @param history - History instance to use for href comparisons
 * @param root - Element under which to intercept link clicks
 * @param callback - Function to call when a click event is intercepted
 */
export default function handleLinks(
  root: Node,
  callback: LinkCallback,
  _window = window
) {
  function traverse(node: any): HTMLAnchorElement | undefined {
    if (!node || node === root) {
      return;
    }

    if (node.localName !== "a" || node.href === undefined) {
      return traverse(node.parentNode);
    }

    return node;
  }

  function handler(e: any) {
    if (
      (e.button && e.button !== 0) ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.shiftKey ||
      e.defaultPrevented
    ) {
      return;
    }

    const anchor = traverse(e.target);

    if (!anchor) {
      return;
    }

    if (
      _window.location.protocol !== anchor.protocol ||
      _window.location.hostname !== anchor.hostname ||
      _window.location.port !== anchor.port ||
      anchor.hasAttribute("data-router-ignore") ||
      anchor.hasAttribute("download") ||
      (anchor.getAttribute("target") === "_blank" &&
        safeExternalLink.test(anchor.getAttribute("rel")!)) ||
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

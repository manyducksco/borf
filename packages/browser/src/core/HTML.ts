import { isFunction, isNumber, isObject, isString } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "./App.js";
import { isRef } from "./Ref.js";
import {
  readable,
  writable,
  isReadable,
  isWritable,
  type Readable,
  type Writable,
  type StopFunction,
} from "./state.js";
import { omit } from "./utils/omit.js";
import { renderMarkupToDOM, type DOMHandle, type Markup } from "./markup.js";

type HTMLOptions = {
  appContext: AppContext;
  elementContext: ElementContext;
  tag: string;
  attributes?: any;
  children?: Markup[];
};

export class HTML implements DOMHandle {
  node;
  attributes;
  children: DOMHandle[];
  stopCallbacks: StopFunction[] = [];
  appContext;
  elementContext;

  // Prevents 'onclickaway' handlers from firing in the same cycle in which the element is connected.
  canClickAway = false;

  get connected() {
    return this.node.parentNode != null;
  }

  constructor({ tag, attributes, children, appContext, elementContext }: HTMLOptions) {
    elementContext = { ...elementContext };

    // This and all nested views will be created as SVG elements.
    if (tag.toLowerCase() === "svg") {
      elementContext.isSVG = true;
    }

    // Create node with the appropriate constructor.
    if (elementContext.isSVG) {
      this.node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    } else {
      this.node = document.createElement(tag);
    }

    const normalizedAttrs: Record<string, any> = {};

    for (const key in attributes) {
      const normalized = key.toLowerCase();

      switch (normalized) {
        case "classname":
          // TODO: Print a warning in dev mode that this isn't technically correct?
          normalizedAttrs["class"] = attributes[key];
          break;
        default:
          normalizedAttrs[key] = attributes[key];
          break;
      }
    }

    // Set ref if present. Refs can be a Ref object or a function that receives the node.
    if (normalizedAttrs.ref) {
      if (isRef(normalizedAttrs.ref)) {
        normalizedAttrs.ref.current = this.node;
      } else if (isFunction(normalizedAttrs.ref)) {
        normalizedAttrs.ref(this.node);
      } else {
        throw new Error("Expected an instance of Ref. Got: " + attributes.ref);
      }
    }

    this.attributes = omit(["ref"], normalizedAttrs);
    this.children = children ? renderMarkupToDOM(children, { appContext, elementContext }) : [];

    this.appContext = appContext;
    this.elementContext = elementContext;
  }

  async connect(parent: Node, after?: Node) {
    if (parent == null) {
      throw new Error(`HTML element requires a parent element as the first argument to connect. Got: ${parent}`);
    }

    if (!this.connected) {
      for (const child of this.children) {
        await child.connect(this.node);
      }

      this.applyAttributes(this.node, this.attributes);
      if (this.attributes.style) this.applyStyles(this.node, this.attributes.style, this.stopCallbacks);
      if (this.attributes.class) this.applyClasses(this.node, this.attributes.class, this.stopCallbacks);
    }

    parent.insertBefore(this.node, after?.nextSibling ?? null);

    setTimeout(() => {
      this.canClickAway = true;
    }, 0);
  }

  async disconnect() {
    if (this.connected) {
      for (const child of this.children) {
        await child.disconnect();
      }

      this.node.parentNode?.removeChild(this.node);

      this.canClickAway = false;

      for (const stop of this.stopCallbacks) {
        stop();
      }
      this.stopCallbacks = [];
    }
  }

  async setChildren(next: DOMHandle[]) {
    const current = this.children;
    const patched: DOMHandle[] = [];
    const length = Math.max(current.length, next.length);

    for (let i = 0; i < length; i++) {
      if (!current[i] && next[i]) {
        // item was added
        patched[i] = next[i];
        await patched[i].connect(this.node, patched[i - 1]?.node);
      } else if (current[i] && !next[i]) {
        // item was removed
        current[i].disconnect();
      } else {
        // current and next both exist (or both don't exist, but that shouldn't happen.)
        // if (current[i].node!.nodeType !== next[i].node!.nodeType) {
        // replace
        patched[i] = next[i];
        current[i].disconnect();
        await patched[i].connect(this.node, patched[i - 1]?.node);
        // } else {
        //   const sameAttrs = deepEqual(current[i].attributes, next[i].attributes);

        //   if (sameAttrs) {
        //     // reuse element, but diff children. have setChildren do diffing?
        //     const children = next[i].children ?? [];
        //     patched[i] = { ...current[i], children };
        //     patched[i].handle.setChildren(children);
        //   } else {
        //     // replace (TODO: patch attrs in place if possible)
        //     patched[i] = next[i];
        //     await patched[i].connect(this.#node, current[i].node);
        //     current[i].disconnect();
        //   }
        // }
      }
    }

    this.children = patched;
  }

  applyAttributes(element: HTMLElement | SVGElement, attrs: Record<string, unknown>) {
    for (const key in attrs) {
      const value = attrs[key];

      // Bind or set value depending on its type.
      if (key === "value") {
        if (isReadable(value)) {
          this.stopCallbacks.push(
            value.observe((current) => {
              (element as any).value = String(current);
            })
          );

          if (isWritable(value)) {
            const listener: EventListener = (e) => {
              const updated = toTypeOf(value.get(), (e.currentTarget as HTMLInputElement).value);
              value.set(updated);
            };

            element.addEventListener("input", listener);

            this.stopCallbacks.push(() => {
              element.removeEventListener("input", listener);
            });
          }
        } else {
          (element as any).value = String(value);
        }
      } else if (eventAttrs.includes(key.toLowerCase())) {
        const eventName = key.slice(2).toLowerCase();

        if (eventName === "clickaway") {
          const listener = (e: Event) => {
            if (this.canClickAway && !element.contains(e.target as any)) {
              if (isReadable<(e: Event) => void>(value)) {
                value.get()(e);
              } else {
                (value as (e: Event) => void)(e);
              }
            }
          };

          window.addEventListener("click", listener);

          this.stopCallbacks.push(() => {
            window.removeEventListener("click", listener);
          });
        } else {
          const listener: (e: Event) => void = isReadable<(e: Event) => void>(value)
            ? (e: Event) => value.get()(e)
            : (value as (e: Event) => void);

          element.addEventListener(eventName, listener);

          this.stopCallbacks.push(() => {
            element.removeEventListener(eventName, listener);
          });
        }
      } else if (!privateAttrs.includes(key)) {
        const isBoolean = booleanAttrs.includes(key);

        if (isReadable(value)) {
          this.stopCallbacks.push(
            value.observe((current) => {
              if (current) {
                element.setAttribute(key, isBoolean ? "" : current.toString());
              } else {
                element.removeAttribute(key);
              }
            })
          );
        } else if (value) {
          element.setAttribute(key, isBoolean ? "" : String(value));
        }
      }
    }
  }

  applyStyles(element: HTMLElement | SVGElement, styles: Record<string, any>, stopCallbacks: StopFunction[]) {
    const propStopCallbacks: StopFunction[] = [];

    if (isReadable<object>(styles)) {
      let unapply: () => void;

      const stop = styles.observe((current) => {
        requestAnimationFrame(() => {
          if (isFunction(unapply)) {
            unapply();
          }
          element.style.cssText = "";
          unapply = this.applyStyles(element, current, stopCallbacks);
        });
      });

      stopCallbacks.push(stop);
      propStopCallbacks.push(stop);
    } else if (isObject(styles)) {
      styles = styles as Record<string, any>;

      for (const key in styles) {
        const value = styles[key];

        // Set style property or attribute.
        const setProperty = key.startsWith("--")
          ? (key: string, value: string | null) => element.style.setProperty(key, value)
          : (key: string, value: string | null) => (element.style[key as any] = value ?? "");

        if (isReadable<any>(value)) {
          const stop = value.observe((current) => {
            if (current) {
              setProperty(key, current);
            } else {
              element.style.removeProperty(key);
            }
          });

          stopCallbacks.push(stop);
          propStopCallbacks.push(stop);
        } else if (isString(value)) {
          setProperty(key, value);
        } else if (isNumber(value)) {
          setProperty(key, value + "px");
        } else {
          throw new TypeError(`Style properties should be strings, $states or numbers. Got (${key}: ${value})`);
        }
      }
    } else {
      throw new TypeError(`Expected style property to be a string, $state, or object. Got: ${styles}`);
    }

    return function unapply() {
      for (const stop of propStopCallbacks) {
        stop();
        stopCallbacks.splice(stopCallbacks.indexOf(stop), 1);
      }
    };
  }

  applyClasses(element: HTMLElement | SVGElement, classes: unknown, stopCallbacks: StopFunction[]) {
    const classStopCallbacks: StopFunction[] = [];

    if (isReadable(classes)) {
      let unapply: () => void;

      const stop = classes.observe((current) => {
        requestAnimationFrame(() => {
          if (isFunction(unapply)) {
            unapply();
          }
          element.removeAttribute("class");
          unapply = this.applyClasses(element, current, stopCallbacks);
        });
      });

      stopCallbacks.push(stop);
      classStopCallbacks.push(stop);
    } else {
      const mapped = getClassMap(classes);

      for (const name in mapped) {
        const value = mapped[name];

        if (isReadable(value)) {
          const stop = value.observe((current) => {
            if (current) {
              element.classList.add(name);
            } else {
              element.classList.remove(name);
            }
          });

          stopCallbacks.push(stop);
          classStopCallbacks.push(stop);
        } else if (value) {
          element.classList.add(name);
        }
      }
    }

    return function unapply() {
      for (const stop of classStopCallbacks) {
        stop();
        stopCallbacks.splice(stopCallbacks.indexOf(stop), 1);
      }
    };
  }
}

function getClassMap(classes: unknown) {
  let mapped: Record<string, boolean> = {};

  if (isString(classes)) {
    // Support multiple classes in one string like HTML.
    const names = classes.split(" ");
    for (const name of names) {
      mapped[name] = true;
    }
  } else if (isObject(classes)) {
    Object.assign(mapped, classes);
  } else if (Array.isArray(classes)) {
    Array.from(classes)
      .filter((item) => item != null)
      .forEach((item) => {
        Object.assign(mapped, getClassMap(item));
      });
  }

  return mapped;
}

/**
 * Attempts to convert `source` to the same type as `target`.
 * Returns `source` as-is if conversion is not possible.
 */
function toTypeOf<T>(target: T, source: unknown): T | unknown {
  const type = typeof target;

  if (type === "string") {
    return String(source);
  }

  if (type === "number") {
    return Number(source);
  }

  if (type === "boolean") {
    return Boolean(source);
  }

  return source;
}

// Attributes in this list will not be forwarded to the DOM node.
const privateAttrs = ["ref", "children", "class", "value", "style", "data"];

const booleanAttrs = [
  "allowfullscreen",
  "async",
  "autocomplete",
  "autofocus",
  "autoplay",
  "checked",
  "contenteditable",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
  "spellcheck",
  "translate",
  "truespeed",
];

const eventAttrs = [
  "onclick",
  "onclickaway",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",
  "ontouchcancel",
  "ontouchend",
  "ontouchmove",
  "ontouchstart",
  "ondragstart",
  "ondrag",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondrop",
  "ondragend",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onunload",
  "onabort",
  "onerror",
  "onresize",
  "onscroll",
  "onselect",
  "onchange",
  "onsubmit",
  "onreset",
  "onfocus",
  "onblur",
  "oninput",
  "onanimationend",
  "onanimationiteration",
  "onanimationstart",
];

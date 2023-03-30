import { Type } from "@borf/bedrock";
import { omit } from "../helpers/omit.js";
import { Ref } from "./Ref.js";

import { Readable, Writable, type StopFunction } from "./Writable.js";
import { Connectable } from "./Connectable.js";
import { type AppContext, type ElementContext } from "./App.js";
import { Markup } from "./Markup.js";

type HTMLOptions = {
  appContext: AppContext;
  elementContext: ElementContext;
  tag: string;
  attributes?: any;
  children?: Markup[];
};

export class HTML extends Connectable {
  #node;
  #attributes;
  #children;
  #appContext;
  #elementContext;
  #stopCallbacks: StopFunction[] = [];

  get node() {
    return this.#node;
  }

  constructor({ tag, attributes, children, appContext, elementContext }: HTMLOptions) {
    super();

    elementContext = { ...elementContext };

    // This and all nested views will be created as SVG elements.
    if (tag.toLowerCase() === "svg") {
      elementContext.isSVG = true;
    }

    // Create node with the appropriate constructor.
    if (elementContext.isSVG) {
      this.#node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    } else {
      this.#node = document.createElement(tag);
    }

    const normalizedAttrs: Record<string, any> = {};

    for (const key in attributes) {
      const normalized = key.toLowerCase();

      switch (normalized) {
        case "classname":
          normalizedAttrs["class"] = attributes[key];
          break;
        default:
          normalizedAttrs[key] = attributes[key];
          break;
      }
    }

    // Set ref if present.
    if (normalizedAttrs.ref) {
      if (Ref.isRef(normalizedAttrs.ref)) {
        normalizedAttrs.ref.element = this.#node;
      } else {
        throw new Error("Expected an instance of Ref. Got: " + attributes.ref);
      }
    }

    this.#attributes = omit(["ref"], normalizedAttrs);
    this.#children = children?.map((c) => c.init({ appContext, elementContext })) ?? [];
    this.#appContext = appContext;
    this.#elementContext = elementContext;
  }

  setChildren(children: Markup[]) {
    if (this.isConnected) {
      for (const child of this.#children) {
        child.disconnect();
      }
    }

    this.#children = children.map((c) =>
      c.init({ appContext: this.#appContext, elementContext: this.#elementContext })
    );

    if (this.isConnected) {
      for (const child of this.#children) {
        child.connect(this.#node);
      }
    }

    applyAttrs(this.#node, this.#attributes, this.#stopCallbacks);
    if (this.#attributes.style) applyStyles(this.#node, this.#attributes.style, this.#stopCallbacks);
    if (this.#attributes.class) applyClasses(this.#node, this.#attributes.class, this.#stopCallbacks);
  }

  async connect(parent: Node, after?: Node) {
    if (!this.isConnected) {
      for (const child of this.#children) {
        child.connect(this.#node);
      }

      applyAttrs(this.#node, this.#attributes, this.#stopCallbacks);
      if (this.#attributes.style) applyStyles(this.#node, this.#attributes.style, this.#stopCallbacks);
      if (this.#attributes.class) applyClasses(this.#node, this.#attributes.class, this.#stopCallbacks);
    }

    parent.insertBefore(this.#node, after?.nextSibling ?? null);
  }

  async disconnect() {
    if (this.isConnected) {
      for (const child of this.#children) {
        child.disconnect();
      }

      this.#node.parentNode!.removeChild(this.#node);

      for (const stop of this.#stopCallbacks) {
        stop();
      }
      this.#stopCallbacks = [];
    }
  }
}

function applyAttrs(element: HTMLElement | SVGElement, attrs: Record<string, unknown>, stopCallbacks: StopFunction[]) {
  for (const key in attrs) {
    const value = attrs[key];

    // Bind or set value depending on its type.
    if (key === "value" && element instanceof HTMLInputElement) {
      if (Readable.isReadable(value)) {
        stopCallbacks.push(
          value.observe((current) => {
            element.value = String(current);
          })
        );

        if (Writable.isWritable(value)) {
          const listener: EventListener = (e) => {
            const updated = toTypeOf(value.value, (e.currentTarget as HTMLInputElement).value);
            value.value = updated;
          };

          element.addEventListener("input", listener);

          stopCallbacks.push(() => {
            element.removeEventListener("input", listener);
          });
        }
      } else {
        element.value = String(value);
      }
    } else if (eventAttrs.includes(key.toLowerCase())) {
      const eventName = key.slice(2).toLowerCase();
      const listener: (e: Event) => void = Readable.isReadable<(e: Event) => void>(value)
        ? (e: Event) => value.value(e)
        : (value as (e: Event) => void);

      element.addEventListener(eventName, listener);

      stopCallbacks.push(() => {
        element.removeEventListener(eventName, listener);
      });
    } else if (!privateAttrs.includes(key)) {
      const isBoolean = booleanAttrs.includes(key);

      if (Readable.isReadable(value)) {
        stopCallbacks.push(
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

function applyStyles(element: HTMLElement | SVGElement, styles: Record<string, any>, stopCallbacks: StopFunction[]) {
  const propStopCallbacks: StopFunction[] = [];

  if (Readable.isReadable<object>(styles)) {
    let unapply: () => void;

    const stop = styles.observe((current) => {
      requestAnimationFrame(() => {
        if (Type.isFunction(unapply)) {
          unapply();
        }
        element.style.cssText = "";
        unapply = applyStyles(element, current, stopCallbacks);
      });
    });

    stopCallbacks.push(stop);
    propStopCallbacks.push(stop);
  } else if (Type.isObject(styles)) {
    styles = styles as Record<string, any>;

    for (const key in styles) {
      const value = styles[key];
      // const setProperty = key.startsWith("--")
      //   ? (key: string, value: string | null) => element.style.setProperty(key, value)
      //   : (key: string, value: string | null) => (element.style[key] = value);

      const setProperty = (key: string, value: string | null) => element.style.setProperty(key, value);

      if (Readable.isReadable<any>(value)) {
        const stop = value.observe((current) => {
          if (current) {
            setProperty(key, current);
          } else {
            element.style.removeProperty(key);
          }
        });

        stopCallbacks.push(stop);
        propStopCallbacks.push(stop);
      } else if (Type.isString(value)) {
        setProperty(key, value);
      } else if (Type.isNumber(value)) {
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

function applyClasses(element: HTMLElement | SVGElement, classes: unknown, stopCallbacks: StopFunction[]) {
  const classStopCallbacks: StopFunction[] = [];

  if (Readable.isReadable(classes)) {
    let unapply: () => void;

    const stop = classes.observe((current) => {
      requestAnimationFrame(() => {
        if (Type.isFunction(unapply)) {
          unapply();
        }
        element.removeAttribute("class");
        unapply = applyClasses(element, current, stopCallbacks);
      });
    });

    stopCallbacks.push(stop);
    classStopCallbacks.push(stop);
  } else {
    const mapped = getClassMap(classes);

    for (const name in mapped) {
      const value = mapped[name];

      if (Readable.isReadable(value)) {
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

function getClassMap(classes: unknown) {
  let mapped: Record<string, boolean> = {};

  if (Type.isString(classes)) {
    // Support multiple classes in one string like HTML.
    const names = classes.split(" ");
    for (const name of names) {
      mapped[name] = true;
    }
  } else if (Type.isObject(classes)) {
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
const privateAttrs = ["$ref", "children", "class", "value", "style", "data"];

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
  "draggable",
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

const selfClosingTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

const eventAttrs = [
  "onclick",
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

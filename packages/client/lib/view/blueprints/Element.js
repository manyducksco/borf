import {
  isArray,
  isObject,
  isString,
  isNumber,
  isFunction,
  isBinding,
  isObservable,
} from "../../helpers/typeChecking.js";
import { omit } from "../../helpers/omit.js";
import { toBlueprints } from "../helpers/toBlueprints.js";

export class ElementBlueprint {
  constructor(tag, attrs, children) {
    this.tag = tag;
    this.attrs = attrs;
    this.children = toBlueprints(children);
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext = {} }) {
    return new ElementView({
      tag: this.tag,
      attrs: this.attrs,
      children: this.children,
      appContext,
      elementContext,
    });
  }
}

/**
 * A woof node representing a native HTML element.
 */
export class ElementView {
  subscriptions = [];

  constructor({ tag, attrs, children, appContext, elementContext }) {
    elementContext = {
      ...elementContext,
    };

    // This and all nested views will be created as SVG elements.
    if (tag.toLowerCase() === "svg") {
      elementContext.isSVG = true;
    }

    // Create node.
    if (elementContext.isSVG) {
      this.node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    } else {
      this.node = document.createElement(tag);
    }

    // Call ref function, if present.
    if (attrs.ref) {
      if (isFunction(attrs.ref)) {
        attrs.ref(this.node);
      } else {
        throw new Error("Ref is not a function. Got: " + attrs.ref);
      }
    }

    this.attrs = omit(["ref"], attrs);
    this.children = children.map((c) => c.build({ appContext, elementContext }));
  }

  get isView() {
    return true;
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  connect(parent, after = null) {
    if (!this.isConnected) {
      for (const child of this.children) {
        child.connect(this.node);
      }

      applyAttrs(this.node, this.attrs, this.subscriptions);
      if (this.attrs.style) applyStyles(this.node, this.attrs.style, this.subscriptions);
      if (this.attrs.class) applyClasses(this.node, this.attrs.class, this.subscriptions);
    }

    parent.insertBefore(this.node, after?.nextSibling);
  }

  disconnect() {
    if (this.isConnected) {
      for (const child of this.children) {
        child.disconnect();
      }

      this.node.parentNode.removeChild(this.node);

      while (this.subscriptions.length > 0) {
        this.subscriptions.shift().unsubscribe();
      }
    }
  }
}

function applyAttrs(element, attrs, subscriptions) {
  for (const key in attrs) {
    const value = attrs[key];

    // Bind or set value depending on its type.
    if (key === "value") {
      if (isBinding(value)) {
        subscriptions.push(
          value.subscribe((current) => {
            element.value = String(current);
          })
        );

        if (value.isWritable) {
          const listener = (e) => {
            const updated = toTypeOf(value.get(), e.target.value);
            value.set(updated);
          };

          element.addEventListener("input", listener);

          subscriptions.push({
            unsubscribe: () => {
              element.removeEventListener("input", listener);
            },
          });
        }
      } else if (isObservable(value)) {
        subscriptions.push(
          value.subscribe((current) => {
            element.value = String(current);
          })
        );
      } else {
        element.value = String(value);
      }
    } else if (eventAttrs.includes(key.toLowerCase())) {
      const eventName = key.slice(2).toLowerCase();
      const listener = isObservable(attrs[key]) ? (e) => attrs[key].get()(e) : attrs[key];

      element.addEventListener(eventName, listener);

      subscriptions.push({
        unsubscribe: () => {
          element.removeEventListener(eventName, listener);
        },
      });
    } else if (!privateAttrs.includes(key)) {
      const isBoolean = booleanAttrs.includes(key);

      if (isObservable(value)) {
        subscriptions.push(
          value.subscribe((current) => {
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

function applyStyles(element, styles, subscriptions) {
  const propSubscriptions = [];

  if (isObservable(styles)) {
    let unapply;

    const subscription = styles.subscribe((current) => {
      requestAnimationFrame(() => {
        if (isFunction(unapply)) {
          unapply();
        }
        element.style = null;
        unapply = applyStyles(element, current, subscriptions);
      });
    });

    subscriptions.push(subscription);
    propSubscriptions.push(subscription);
  } else if (isString(styles)) {
    element.style = styles;
  } else if (isObject(styles)) {
    for (const key in styles) {
      const value = styles[key];
      const setProperty = key.startsWith("--")
        ? (key, value) => element.style.setProperty(key, value)
        : (key, value) => (element.style[key] = value);

      if (isObservable(value)) {
        const subscription = value.subscribe((current) => {
          if (current) {
            setProperty(key, current);
          } else {
            element.style.removeProperty(key);
          }
        });

        subscriptions.push(subscription);
        propSubscriptions.push(subscription);
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
    for (const subscription of propSubscriptions) {
      subscription.unsubscribe();
      subscriptions.splice(subscriptions.indexOf(subscription), 1);
    }
  };
}

function applyClasses(element, classes, subscriptions) {
  const classSubscriptions = [];

  if (isObservable(classes)) {
    let unapply;

    const subscription = classes.subscribe((current) => {
      requestAnimationFrame(() => {
        if (isFunction(unapply)) {
          unapply();
        }
        element.removeAttribute("class");
        unapply = applyClasses(element, current, subscriptions);
      });
    });

    subscriptions.push(subscription);
    classSubscriptions.push(subscription);
  } else {
    const mapped = getClassMap(classes);

    for (const name in mapped) {
      const value = mapped[name];

      if (isObservable(value)) {
        const subscription = value.subscribe((current) => {
          if (current) {
            element.classList.add(name);
          } else {
            element.classList.remove(name);
          }
        });

        subscriptions.push(subscription);
        classSubscriptions.push(subscription);
      } else if (value) {
        element.classList.add(name);
      }
    }
  }

  return function unapply() {
    for (const subscription of classSubscriptions) {
      subscription.unsubscribe();
      subscriptions.splice(subscriptions.indexOf(subscription), 1);
    }
  };
}

function getClassMap(classes) {
  let mapped = {};

  if (isString(classes)) {
    // Support multiple classes in one string like HTML.
    const names = classes.split(" ");
    for (const name of names) {
      mapped[name] = true;
    }
  } else if (isObject(classes)) {
    Object.assign(mapped, classes);
  } else if (isArray(classes)) {
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
function toTypeOf(target, source) {
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

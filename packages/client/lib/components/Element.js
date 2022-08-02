import { isArray, isObject, isString, isNumber, isFunction, isBinding, isObservable } from "../helpers/typeChecking.js";
import { elementContextKey } from "../helpers/initComponent.js";

/**
 * Implements logic for HTML elements created with `h()`.
 */
export function Element() {
  const elementContext = this[elementContextKey];

  const tagname = this.$attrs.get("tagname");
  const attrs = this.$attrs.get("attrs") || {}; // attrs passed to the element itself

  let node;

  if (elementContext.isSVG) {
    node = document.createElementNS("http://www.w3.org/2000/svg", tagname);
  } else {
    node = document.createElement(tagname);
  }

  if (attrs.$ref) {
    attrs.$ref.set(node);
  }

  // Alias React-style 'className' attributes to 'class'.
  if (attrs.className) {
    attrs.class = attrs.className;
    delete attrs.className;
  }

  let subscriptions = [];

  this.beforeConnect(() => {
    for (const child of this.children) {
      child.connect(node);
    }

    applyAttrs(node, attrs, subscriptions);
    if (attrs.style) applyStyles(node, attrs.style, subscriptions);
    if (attrs.class) applyClasses(node, attrs.class, subscriptions);
  });

  this.afterDisconnect(async () => {
    for (const child of this.children) {
      child.disconnect();
    }

    for (const subscription of subscriptions) {
      subscription.unsubscribe();
    }
    subscriptions = [];
  });

  return node;
}

function applyAttrs(element, attrs, subscriptions) {
  for (const key in attrs) {
    const value = attrs[key];

    // Bind or set value depending on its type.
    if (key === "value") {
      console.log({ key, value, isBinding: isBinding(value) });

      if (isObservable(value)) {
        subscriptions.push(
          value.subscribe((current) => {
            element.value = String(current);
          })
        );
      } else if (isBinding(value)) {
        subscriptions.push(
          value.$value.subscribe((current) => {
            console.log("subscribed", current);
            element.value = String(current);
          })
        );

        console.log(value.$value.get());

        const listener = (e) => {
          const updated = toSameType(value.$value.get(), e.target.value);
          value.$value.set(updated);
        };

        element.addEventListener(value.event, listener);

        subscriptions.push({
          unsubscribe: () => {
            element.removeEventListener(value.event, listener);
          },
        });
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

      if (isObservable(value)) {
        const subscription = value.subscribe((current) => {
          if (current) {
            element.style.setProperty(key, current);
          } else {
            element.style.removeProperty(key);
          }
        });

        subscriptions.push(subscription);
        propSubscriptions.push(subscription);
      } else if (isString(value)) {
        element.style.setProperty(key, value);
      } else if (isNumber(value)) {
        element.style.setProperty(key, value + "px");
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
function toSameType(target, source) {
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

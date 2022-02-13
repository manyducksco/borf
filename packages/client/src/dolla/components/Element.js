import { isState } from "@woofjs/state";
import { makeComponent } from "../../makeComponent.js";
import { isArray, isObject, isString, isNumber, isFunction, isBinding } from "../../helpers/typeChecking.js";

export const Element = makeComponent(($, self) => {
  const { $attrs, children } = self;

  const tag = $attrs.get("tag");
  const attrs = $attrs.get("attrs"); // attrs passed to the element itself

  const node = document.createElement(tag);

  if (attrs.$ref) {
    attrs.$ref.set(node);
  }

  let watchers = [];

  self.beforeConnect(async () => {
    let previous = null;

    for (const child of children) {
      await child.connect(node, previous?.element);
      previous = child;
    }

    applyAttrs(node, attrs, watchers);
    if (attrs.style) applyStyles(node, attrs.style, watchers);
    if (attrs.class) applyClasses(node, attrs.class, watchers);
    attachEventListeners(node, attrs, watchers);
  });

  self.disconnected(async () => {
    for (const child of children) {
      await child.disconnect();
    }

    for (const callback of watchers) {
      callback();
    }
    watchers = [];
  });

  return node;
});

function watch($state, callback) {
  const unwatch = $state.watch((value) => {
    requestAnimationFrame(() => {
      callback(value);
    });
  });

  callback($state.get());

  return unwatch;
}

function applyAttrs(element, attrs, watchers) {
  for (const key in attrs) {
    const value = attrs[key];

    // Bind or set value depending on its type.
    if (key === "value") {
      if (isState(value)) {
        watchers.push(
          watch(value, (current) => {
            element.value = String(current);
          })
        );
      } else if (isBinding(value)) {
        watchers.push(
          watch(value.state, (current) => {
            element.value = String(current);
          })
        );

        const listener = (e) => {
          const updated = toSameType(value.state.get(), e.target.value);
          value.state.set(updated);
        };

        element.addEventListener(value.event, listener);

        watchers.push(() => {
          element.removeEventListener(value.event, listener);
        });
      } else {
        element.value = String(value);
      }
    } else if (attrMap.events.includes(key)) {
      const eventName = key.slice(2).toLowerCase();
      const listener = attrs[key];

      element.addEventListener(eventName, listener);

      watchers.push(() => {
        element.removeEventListener(eventName, listener);
      });
    } else if (!attrMap.private.includes(key)) {
      const isBoolean = attrMap.boolean.includes(key);

      if (isState(value)) {
        watchers.push(
          watch(value, (current) => {
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

function applyStyles(element, styles, watchers) {
  const propWatchers = [];

  if (isState(styles)) {
    let unapply;

    const unwatch = watch(styles, (current) => {
      requestAnimationFrame(() => {
        if (isFunction(unapply)) {
          unapply();
        }
        element.style = null;
        unapply = applyStyles(element, current, watchers);
      });
    });

    watchers.push(unwatch);
    propWatchers.push(unwatch);
  } else if (isString(styles)) {
    element.style = styles;
  } else if (isObject(styles)) {
    for (const key in styles) {
      const value = styles[key];
      const setProperty =
        key.indexOf("-") > -1
          ? (key, value) => element.style.setProperty(key, value)
          : (key, value) => (element.style[key] = value);

      if (isState(value)) {
        const unwatch = watch(value, (current) => {
          if (current) {
            setProperty(key, current);
          } else {
            element.style.removeProperty(key);
          }
        });

        watchers.push(unwatch);
        propWatchers.push(unwatch);
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
    for (const unwatch of propWatchers) {
      unwatch();
      watchers.splice(watchers.indexOf(unwatch), 1);
    }
  };
}

function applyClasses(element, classes, watchers) {
  const classWatchers = [];

  if (isState(classes)) {
    let unapply;

    const unwatch = watch(classes, (current) => {
      requestAnimationFrame(() => {
        if (isFunction(unapply)) {
          unapply();
        }
        element.removeAttribute("class");
        unapply = applyClasses(element, current, watchers);
      });
    });

    watchers.push(unwatch);
    classWatchers.push(unwatch);
  } else {
    const mapped = getClassMap(classes);

    for (const name in mapped) {
      const value = mapped[name];

      if (isState(value)) {
        const unwatch = watch(value, (current) => {
          if (current) {
            element.classList.add(name);
          } else {
            element.classList.remove(name);
          }
        });

        watchers.push(unwatch);
        classWatchers.push(unwatch);
      } else if (value) {
        element.classList.add(name);
      }
    }
  }

  return function unapply() {
    for (const unwatch of classWatchers) {
      unwatch();
      watchers.splice(watchers.indexOf(unwatch), 1);
    }
  };
}

function attachEventListeners(element, attrs, watchers) {}

function getClassMap(classes) {
  let mapped = {};

  if (isString(classes)) {
    // Support multiple classes in one string like HTML.
    const names = classes.split(" ");
    for (const name of names) {
      mapped[name] = true;
    }
  } else if (isObject(classes)) {
    mapped = {
      ...mapped,
      ...classes,
    };
  } else if (isArray(classes)) {
    Array.from(classes)
      .filter((item) => item != null)
      .forEach((item) => {
        mapped = {
          ...mapped,
          ...getClassMap(item),
        };
      });
  }

  return mapped;
}

/**
 * Attempts to convert a `source` value to the same type as a `target` value.
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

const attrMap = {
  // Attributes in this list will not be forwarded to the DOM node.
  private: ["$ref", "children", "class", "value", "style", "data"],
  boolean: [
    "disabled",
    "contenteditable",
    "draggable",
    "hidden",
    "spellcheck",
    "autocomplete",
    "autofocus",
    "translate",
  ],
  events: [
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
  ],
};
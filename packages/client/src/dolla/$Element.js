import { isState } from "@woofjs/state";
import { isArray, isObject, isString, isNumber, isFunction } from "../helpers/typeChecking.js";
import { $Node } from "./$Node.js";

const attrMap = {
  // Attributes in this list will not be forwarded to the DOM node.
  private: ["ref", "children", "class", "value", "style", "data"],
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

export class $Element extends $Node {
  tag;
  attrs;
  children;
  watchers = [];

  get isElement() {
    return true;
  }

  constructor(tag, attrs = {}, children = []) {
    super();

    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
  }

  createElement() {
    return document.createElement(this.tag);
  }

  beforeConnect() {
    let previous = null;

    for (const child of this.children) {
      child.connect(this.element, previous?.$element);
      previous = child;
    }

    this.#applyAttrs();
    this.#applyStyles(this.attrs.style);
    this.#applyClasses(this.attrs.class);
    this.#attachEvents();
  }

  connected() {
    if (this.attrs.ref) {
      this.attrs.ref.set(this.element);
    }
  }

  disconnected() {
    for (const child of this.children) {
      child.disconnect();
    }

    // Cancel listens, bindings and event handlers
    for (const cancel of this.watchers) {
      cancel();
    }
    this.watchers = [];
  }

  #attachEvents() {
    for (const key in this.attrs) {
      if (!attrMap.private.includes(key) && attrMap.events.includes(key)) {
        const eventName = key.slice(2).toLowerCase();
        const listener = this.attrs[key];

        this.element.addEventListener(eventName, listener);

        this.watchers.push(() => {
          this.element.removeEventListener(eventName, listener);
        });
      }
    }
  }

  #applyClasses(classes) {
    const unwatchers = [];

    if (classes) {
      if (isState(classes)) {
        let unapply;

        unwatchers.push(
          this.#watch(classes, (value) => {
            requestAnimationFrame(() => {
              if (isFunction(unapply)) {
                unapply();
              }

              this.element.removeAttribute("class");

              unapply = this.#applyClasses(value);
            });
          })
        );
      } else {
        const mapped = getClassMap(classes);

        for (const name in mapped) {
          const value = mapped[name];

          if (isState(value)) {
            unwatchers.push(
              this.#watch(value, (current) => {
                if (current) {
                  this.element.classList.add(name);
                } else {
                  this.element.classList.remove(name);
                }
              })
            );
          } else if (value) {
            this.element.classList.add(name);
          }
        }
      }
    }

    return function unapply() {
      for (const unwatch of unwatchers) {
        unwatch();
      }
    };
  }

  #applyStyles(style) {
    const unwatchers = [];

    if (style) {
      if (isState(style)) {
        let unapply;

        this.#watch(style, (value) => {
          requestAnimationFrame(() => {
            if (isFunction(unapply)) {
              unapply();
            }
            this.element.style = null;
            unapply = this.#applyStyles(value);
          });
        });
      } else if (isString(style)) {
        this.element.style = style;
      } else if (isObject(style)) {
        for (const name in style) {
          const prop = style[name];

          if (isState(prop)) {
            unwatchers.push(
              this.#watch(prop, (value) => {
                this.element.style[name] = value;
              })
            );
          } else if (isString(prop)) {
            this.element.style[name] = prop;
          } else if (isNumber(prop)) {
            this.element.style[name] = prop + "px";
          } else {
            throw new TypeError(`Style value should be a string or number. Got (${name}: ${prop})`);
          }
        }
      } else {
        throw new TypeError(`Expected style attribute to be a string or object. Got: ${style}`);
      }
    }

    return function unapply() {
      for (const unwatch of unwatchers) {
        unwatch();
      }
    };
  }

  #applyAttrs() {
    for (const name in this.attrs) {
      const attr = this.attrs[name];

      if (name === "value") {
        if (isState(attr)) {
          this.#watch(attr, (value) => {
            this.element.value = String(value);
          });
        } else if (isObject(attr) && attr.isBinding) {
          this.#watch(attr.state, (value) => {
            this.element.value = String(value);
          });

          this.element.addEventListener(attr.event, (e) => {
            const value = toSameType(attr.state.get(), e.target.value);

            attr.state.set(value);
          });
        } else {
          this.element.value = String(this.attrs.value);
        }
      }

      if (!attrMap.private.includes(name) && !attrMap.events.includes(name)) {
        if (attrMap.boolean.includes(name)) {
          if (isState(attr)) {
            this.#watch(attr, (value) => {
              if (value) {
                this.element.setAttribute(name, "");
              } else {
                this.element.removeAttribute(name);
              }
            });
          } else if (attr) {
            this.element.setAttribute(name, "");
          }
        } else {
          if (isState(attr)) {
            this.#watch(attr, (value) => {
              if (value) {
                this.element.setAttribute(name, value.toString());
              } else {
                this.element.removeAttribute(name);
              }
            });
          } else if (attr) {
            this.element.setAttribute(name, String(attr));
          }
        }
      }
    }
  }

  #watch(state, callback) {
    const { watchers } = this;

    const cancel = state.watch((value) => {
      requestAnimationFrame(() => {
        callback(value);
      });
    });

    watchers.push(cancel);

    callback(state.get());

    return function unwatch() {
      cancel();
      watchers.splice(watchers.indexOf(cancel), 1);
    };
  }
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

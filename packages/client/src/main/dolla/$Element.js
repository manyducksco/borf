import {
  isArray,
  isObject,
  isString,
  isState,
  isNumber,
} from "../../_helpers/typeChecking";
import { $Node } from "./$Node";

// Attributes in this list will not be forwarded to the DOM node.
const privateAttrs = ["children", "class", "value", "style", "data"];

const booleanAttrs = [
  "disabled",
  "contenteditable",
  "draggable",
  "hidden",
  "spellcheck",
  "autocomplete",
  "autofocus",
  "translate",
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

export class $Element extends $Node {
  tag;
  attributes;
  children;
  watchers = [];

  constructor(tag, attributes = {}, children = []) {
    super();

    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
  }

  createElement() {
    if (this.tag === "") {
      return document.createDocumentFragment();
    } else {
      return document.createElement(this.tag);
    }
  }

  _beforeConnect() {
    let previous = null;

    for (const child of this.children) {
      child.$connect(this.$element, previous?.$element);
      previous = child;
    }

    this.#applyAttributes();
    this.#applyStyles();
    this.#applyClasses();
  }

  _connected() {
    this.#attachEvents();
  }

  _disconnected() {
    for (const child of this.children) {
      child.$disconnect();
    }

    // Cancel listens, bindings and event handlers
    for (const cancel of this.watchers) {
      cancel();
    }
    this.watchers = [];
  }

  #attachEvents() {
    for (const key in this.attributes) {
      if (!privateAttrs.includes(key) && eventAttrs.includes(key)) {
        const eventName = key.slice(2).toLowerCase();
        const listener = this.attributes[key];

        this.$element.addEventListener(eventName, listener);

        this.watchers.push(() => {
          this.$element.removeEventListener(eventName, listener);
        });
      }
    }
  }

  #applyClasses() {
    if (this.attributes.class) {
      const mapped = getClassMap(this.attributes.class);

      for (const name in mapped) {
        const value = mapped[name];

        if (isState(value)) {
          this.#watch(value, (value) => {
            if (value) {
              this.$element.classList.add(name);
            } else {
              this.$element.classList.remove(name);
            }
          });
        } else if (value) {
          this.$element.classList.add(name);
        }
      }
    }
  }

  #applyStyles() {
    if (this.attributes.style) {
      for (const name in this.attributes.style) {
        const prop = this.attributes.style[name];

        if (isState(prop)) {
          this.#watch(prop, (value) => {
            this.$element.style[name] = value;
          });
        } else if (isString(prop)) {
          this.$element.style[name] = prop;
        } else if (isNumber(prop)) {
          this.$element.style[name] = prop + "px";
        } else {
          throw new TypeError(
            `Style value should be a string or number. Received (${name}: ${prop})`
          );
        }
      }
    }
  }

  #applyAttributes() {
    for (const name in this.attributes) {
      const attr = this.attributes[name];

      if (name === "value") {
        if (isState(attr)) {
          this.#watch(attr, (value) => {
            this.$element.value = String(value);
          });
        } else if (isObject(attr) && attr.isBinding) {
          this.#watch(attr.state, (value) => {
            this.$element.value = String(value);
          });

          this.$element.addEventListener(attr.event, (e) => {
            const value = toSameType(attr.state.get(), e.target.value);

            attr.state.set(value);
          });
        } else {
          this.$element.value = String(this.attributes.value);
        }
      }

      if (!privateAttrs.includes(name) && !eventAttrs.includes(name)) {
        if (booleanAttrs.includes(name)) {
          if (isState(attr)) {
            this.#watch(attr, (value) => {
              if (value) {
                this.$element.setAttribute(name, "");
              } else {
                this.$element.removeAttribute(name);
              }
            });
          } else if (attr) {
            this.$element.setAttribute(name, "");
          }
        } else {
          if (isState(attr)) {
            this.#watch(attr, (value) => {
              if (value) {
                this.$element.setAttribute(name, value.toString());
              } else {
                this.$element.removeAttribute(name);
              }
            });
          } else if (attr) {
            this.$element.setAttribute(name, String(attr));
          }
        }
      }
    }
  }

  #watch(state, callback) {
    // TODO: Batch updates -- does this batch efficiently?

    this.watchers.push(
      state.watch((value) => {
        requestAnimationFrame(() => {
          callback(value);
        });
      })
    );

    callback(state.get());
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
    Array.from(classes).forEach((item) => {
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

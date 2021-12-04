import {
  isArray,
  isObject,
  isString,
  isFunction,
  isNumber,
} from "../_helpers/typeChecking";
import { $Node } from "./$Node";
import { $Text } from "./$Text";

// Props in this list will not be forwarded to the DOM node.
const privateProps = [
  "children",
  "class",
  "value",
  "style",
  "data",
  "beforeConnect",
  "connected",
  "beforeDisconnect",
  "disconnected",
];

const booleanProps = [
  "disabled",
  "contenteditable",
  "draggable",
  "hidden",
  "spellcheck",
  "autocomplete",
  "autofocus",
  "translate",
];

const eventRegex = /^on[a-z]/;

export class $Element extends $Node {
  tag;
  props;
  children;
  cancellers = [];

  constructor(tag, props = {}, children = []) {
    super();

    this.tag = tag;
    this.props = Object.freeze({ ...props });
    this.children = children;
  }

  createElement() {
    return document.createElement(this.tag);
  }

  beforeConnect() {
    const { props } = this;

    let previous = null;

    for (const child of this.children) {
      child.connect(this.element, previous?.element);
      previous = child;
    }

    this.#applyAttributes();
    this.#applyStyles();
    this.#applyClasses();

    if (props.beforeConnect) {
      props.beforeConnect();
    }
  }

  connected() {
    const { props } = this;

    this.#attachEvents();

    if (props.connected) {
      props.connected();
    }
  }

  beforeDisconnect() {
    const { props } = this;

    if (props.beforeDisconnect) {
      props.beforeDisconnect();
    }
  }

  disconnected() {
    const { props } = this;

    for (const child of this.children) {
      child.disconnect();
    }

    // Cancel listens, bindings and event handlers
    for (const cancel of this.cancellers) {
      cancel();
    }
    this.cancellers = [];

    if (props.disconnected) {
      props.disconnected();
    }
  }

  #attachEvents() {
    for (const key in this.props) {
      if (!privateProps.includes(key) && eventRegex.test(key)) {
        const eventName = key.slice(2).toLowerCase();
        const listener = this.props[key];

        this.element.addEventListener(eventName, listener);

        this.cancellers.push(() => {
          this.element.removeEventListener(eventName, listener);
        });
      }
    }
  }

  #applyClasses() {
    if (this.props.class) {
      const mapped = getClassMap(this.props.class);

      for (const name in mapped) {
        const value = mapped[name];

        if (isFunction(value)) {
          this.#listenTo(value, (value) => {
            if (value) {
              this.element.classList.add(name);
            } else {
              this.element.classList.remove(name);
            }
          });
        } else if (value) {
          this.element.classList.add(name);
        }
      }
    }
  }

  #applyStyles() {
    if (this.props.style) {
      for (const name in this.props.style) {
        const prop = this.props.style[name];

        if (isFunction(prop)) {
          this.#listenTo(prop, (value) => {
            this.element.style[name] = value;
          });
        } else if (isString(prop)) {
          this.element.style[name] = prop;
        } else {
          throw new TypeError(
            `Style value should be a string (${name}: ${prop})`
          );
        }
      }
    }
  }

  #applyAttributes() {
    for (const name in this.props) {
      const attr = this.props[name];

      if (name === "value") {
        if (isFunction(attr)) {
          this.#listenTo(attr, (value) => {
            this.element.value = String(value);
          });
        } else if (isObject(attr) && attr.isBinding) {
          this.#listenTo(attr.state, (value) => {
            this.element.value = String(value);
          });

          this.element.addEventListener(attr.event, (e) => {
            const value = toSameType(attr.state(), e.target.value);

            attr.state(value);
          });
        } else {
          this.element.value = String(this.props.value);
        }
      }

      if (!privateProps.includes(name) && !eventRegex.test(name)) {
        if (booleanProps.includes(name)) {
          if (isFunction(attr)) {
            this.#listenTo(attr, (value) => {
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
          if (isFunction(attr)) {
            this.#listenTo(attr, (value) => {
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

  #listenTo(state, callback) {
    const cancel = state((value) => {
      requestAnimationFrame(() => {
        callback(value);
      });
    });

    this.cancellers.push(cancel);

    callback(state());
  }
}

function getClassMap(classes) {
  let mapped = {};

  if (isString(classes)) {
    mapped[classes] = true;
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

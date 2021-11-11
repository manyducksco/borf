import {
  isArray,
  isObject,
  isString,
  isFunction,
  isNumber,
} from "./utils/typeChecking";
import { $Node } from "./$Node";

// Any props in this list will NOT be forwarded to the DOM node.
// These can be component-specific props or props that need special handling to apply.
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

export class $Text extends $Node {
  constructor(value) {
    super();

    this.value = value;
  }

  createElement() {
    return document.createTextNode(this.value);
  }
}

export class $Element extends $Node {
  tag;
  props;
  children;
  cancellers = [];

  constructor(tag, props = {}, children = []) {
    super();

    this.tag = tag;
    this.props = Object.freeze({ ...props });
    this.children = children.map((child) => {
      if (isString(child) || isNumber(child)) {
        return new $Text(child);
      }

      return child;
    });
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

    this.applyAttributes();
    this.applyStyles();
    this.applyClasses();

    if (props.beforeConnect) {
      props.beforeConnect();
    }
  }

  connected() {
    const { props } = this;

    this.attachEvents();

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

    if (props.disconnected) {
      props.disconnected();
    }
  }

  attachEvents() {
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

  applyClasses() {
    if (this.props.class) {
      const mapped = getClassMap(this.props.class);

      for (const name in mapped) {
        const value = mapped[name];

        if (isFunction(value)) {
          this.listenTo(value, (value) => {
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

  applyStyles() {
    if (this.props.style) {
      for (const name in this.props.style) {
        const prop = this.props.style[name];

        if (isFunction(prop)) {
          this.listenTo(prop, (value) => {
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

  applyAttributes() {
    for (const name in this.props) {
      if (name === "value") {
        if (isFunction(this.props.value)) {
          const state = this.props.value;

          this.listenTo(state, (value) => {
            this.element.value = String(value);
          });
        } else {
          this.element.value = String(this.props.value);
        }
      }

      if (!privateProps.includes(name) && !eventRegex.test(name)) {
        const attr = this.props[name];

        if (booleanProps.includes(name)) {
          if (isFunction(attr)) {
            this.listenTo(attr, (value) => {
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
            this.listenTo(attr, (value) => {
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

    // Syntax for two way data binding?
    // $("input")({
    //   type: "text",
    //   value: $.bind(value),
    // });
    // $("input")({
    //   type: "text",
    //   value: value,
    //   onchange: (e) => {
    //     value(e.target.value);
    //   }
    // });
  }

  listenTo(state, callback) {
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
      ...getClassMap(classes),
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

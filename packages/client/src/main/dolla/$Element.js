import { makeState, isState } from "@woofjs/state";
import { isArray, isObject, isString, isNumber } from "../../_helpers/typeChecking";
import { $Node } from "./$Node";

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

// This is the object created by dolla.
// Components should return the same.
// const node = {
//   element: {
//     tag: "div",
//     attrs: {},
//     children: [],
//   },
//   // null if dolla element
//   component: {
//     name: "SomeName",
//     debug: {
//       label: "component:custom",
//     },
//     async preload(render) {}, // calls render with an element to display during preload, resolves when preload calls `done`
//     beforeConnect() {},
//     connected() {},
//     beforeDisconnect() {},
//     disconnected() {},
//   },
// };

// function makeString(node) {
//   const { element } = node;
// }

// function makeDOM(node) {
//   const { element } = node;
//   let dom;

//   if (element.tag === ":text:") {
//     if (element.children.some((x) => !isString(x))) {
//       throw new Error(`All children of a :text: node must be strings.`);
//     }
//     dom = document.createTextNode(element.children.length > 0 ? element.children.join(" ") : "");
//     return dom;
//   } else if (element.tag === ":fragment:") {
//     dom = document.createDocumentFragment();

//     for (const child of children) {
//       dom.appendChild(makeDOM(child));
//     }
//     return;
//   }

//   dom = document.createElement(element.tag);

//   const children = [];

//   return {
//     connect(parent, after) {
//       const wasConnected = dom.parentNode != null;

//       if (!wasConnected) {
//         node.beforeConnect();

//         let after;
//         for (const node of element.children) {
//           const child = makeDOM(node);
//           children.push(child);
//           child.connect(dom, after);
//           after = child;
//         }
//       }

//       parent.insertBefore(dom, after ? after.nextSibling : null);

//       if (!wasConnected) {
//         node.connected();
//       }
//     },
//     disconnect() {
//       if (dom.parentNode) {
//         node.beforeDisconnect();
//         dom.parentNode.removeChild(dom);

//         while (children.length > 0) {
//           const child = children.pop();
//           child.disconnect();
//         }

//         node.disconnected();
//       }
//     },
//   };
// }

// function makeElement() {}

// makeElement("div", {});

// // if tag is string, make element
// $("div", { class: { test: true } }, "Test");
// const element = makeElement("div", ...stuff); // ends up with an element

// // if tag is component, create component
// $(SomeComponent, { name: "test" });
// const component = SomeComponent.create(...stuff);
// const element = component.element; // ends up with an element

// $.text($state);
// element = makeElement(":text:", $state);
// element = makeElement(":")

// One base type - DollaElement
// Separate function for rendering that receives the element

// function renderToDOM(component) {
//   const $ = makeDolla();
//   const el = component.createElement($);
// }

// function renderToString() {}

// // Returns the root DOM node
// const node = renderToDOM(SomeElement);

// // Returns an HTML string (sans event listeners)
// const html = renderToString(SomeElement);

// // Some kind of theoretical binding to a native UI library, a la React Native
// const native = renderToNative(SomeElement);

// class Label extends Component {}

// class NativeElement extends Component {
//   render($) {
//     return $(Label)({ text: "THIS IS TEXT" });
//   }
// }

export class $Element extends $Node {
  tag;
  attributes;
  children;
  watchers = [];

  get isElement() {
    return true;
  }

  constructor(tag, attributes = {}, children = []) {
    super();

    this.tag = tag;
    this.attributes = attributes;
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

    this.#applyAttributes();
    this.#applyStyles();
    this.#applyClasses();
    this.#attachEvents();
  }

  connected() {
    if (this.attributes.ref) {
      this.attributes.ref.set(this.element);
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
    for (const key in this.attributes) {
      if (!attrMap.private.includes(key) && attrMap.events.includes(key)) {
        const eventName = key.slice(2).toLowerCase();
        const listener = this.attributes[key];

        this.element.addEventListener(eventName, listener);

        this.watchers.push(() => {
          this.element.removeEventListener(eventName, listener);
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
    if (this.attributes.style) {
      for (const name in this.attributes.style) {
        const prop = this.attributes.style[name];

        if (isState(prop)) {
          this.#watch(prop, (value) => {
            this.element.style[name] = value;
          });
        } else if (isString(prop)) {
          this.element.style[name] = prop;
        } else if (isNumber(prop)) {
          this.element.style[name] = prop + "px";
        } else {
          throw new TypeError(`Style value should be a string or number. Received (${name}: ${prop})`);
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
          this.element.value = String(this.attributes.value);
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

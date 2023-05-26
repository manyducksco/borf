import htm from "htm";
import colorHash from "simple-color-hash";

export const html = htm.bind((type, attributes, ...children) => {
  return { type, attributes, children } as VNode;
});

export const css = (strings: TemplateStringsArray, ...values: any[]) => {
  let concat = "";

  // Just re-assemble again. The string will be compared and replaced as a whole.
  for (let i = 0; i < strings.length; i++) {
    concat += strings[i];
    if (values[i]) {
      concat += values[i];
    }
  }

  return concat;
};

type DefaultState = Record<string, any>;
type DefaultAttrs = Record<string, any>;

interface VNode {
  type: string;
  attributes: DefaultAttrs;
  children: (VNode | string | number | boolean)[];
}

type ElementContext<State, Attrs> = {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;

  get(): State;
  get<Key extends keyof State>(key: Key): State[Key];
  set<Key extends keyof State>(key: Key, value: State[Key]): void;
  set(values: Partial<State>): void;

  on(
    event: string,
    callback: (e: unknown) => void,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  emit(event: string, data?: any): void;

  render(
    callback: (state: State, attrs: Attrs) => VNode | VNode[] | null
  ): void;

  styles(callback: (state: State, attrs: Attrs) => string): void;
};

type ElementFn<State, Attrs> = (c: ElementContext<State, Attrs>) => void;

export function element<State = DefaultState, Attrs = DefaultAttrs>(
  tag: string,
  observedAttrs: keyof Attrs[],
  fn: ElementFn<State, Attrs>
): void;

export function element<State = DefaultState, Attrs = DefaultAttrs>(
  tag: string,
  fn: ElementFn<State, Attrs>
): void;

export function element<State = DefaultState, Attrs = DefaultAttrs>(
  tag: string,
  ...args: any[]
) {
  let observedAttrs: string[] = [];
  let fn: ElementFn<State, Attrs>;

  if (args.length === 2) {
    observedAttrs = args[0];
    fn = args[1];
  } else {
    fn = args[0];
  }

  if ("customElements" in window) {
    customElements.define(
      tag,
      class extends Elemental<State, Attrs> {
        static get observedAttributes() {
          return observedAttrs;
        }

        _fn = fn;
      },
      {}
    );
  } else {
    console.error(
      `Did not register '${tag}' element; custom elements are not supported in this browser.`
    );
  }
}

function getLogLevel() {
  if ("ELEMENTAL_LOG_LEVEL" in window) {
    switch (window.ELEMENTAL_LOG_LEVEL) {
      case "debug":
      case 0:
        return 0;
      case "info":
      case 1:
        return 1;
      case "log":
      case 2:
        return 2;
      case "warn":
      case 3:
        return 3;
      case 4:
      case "error":
        return 4;
      default:
        return 4; // errors only by default
    }
  }

  return 4;
}

function noOp() {}

function hash(value: string) {
  return colorHash({
    str: value,
    sat: { min: 0.35, max: 0.55 },
    light: { min: 0.6, max: 0.6 },
  });
}

class Elemental<State, Attrs> extends HTMLElement {
  _fn!: ElementFn<State, Attrs>;

  _disconnect?: () => void;
  _update?: (attributes?: Attrs, children?: VNode[]) => void;
  _renderCallback!: (state: State, attrs: Attrs) => VNode | VNode[] | null;
  _stylesCallback?: (state: State, attrs: Attrs) => string;

  _state = {} as State;
  _attributes = {} as Attrs;
  _context: ElementContext<State, Attrs>;
  _styleElement?: HTMLStyleElement;

  _initialized = false;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const self = this;
    const tag = this.tagName.toLowerCase();

    const state = this._state as any;
    const attributes = this._attributes as any;

    for (const name of this.getAttributeNames()) {
      let attr = this.getAttribute(name);
      if (name.startsWith("on") && typeof attr === "string") {
        attr = (0, eval)(attr);
      }
      attributes[name] = attr;
    }

    for (const name in attributes) {
      if (name.startsWith("on")) {
        this.addEventListener(name.slice(2), attributes[name]);
      }
    }

    this._context = {
      get debug() {
        if (getLogLevel() > 0) {
          return noOp;
        } else {
          const label = `%c${tag}`;
          return console.debug.bind(
            console,
            label,
            `color:${hash(label)};font-weight:bold`
          );
        }
      },
      get info() {
        if (getLogLevel() > 1) {
          return noOp;
        } else {
          const label = `%c${tag}`;
          return console.info.bind(
            console,
            label,
            `color:${hash(label)};font-weight:bold`
          );
        }
      },
      get log() {
        if (getLogLevel() > 2) {
          return noOp;
        } else {
          const label = `%c${tag}`;
          return console.log.bind(
            console,
            label,
            `color:${hash(label)};font-weight:bold`
          );
        }
      },
      get warn() {
        if (getLogLevel() > 3) {
          return noOp;
        } else {
          const label = `%c${tag}`;
          return console.warn.bind(
            console,
            label,
            `color:${hash(label)};font-weight:bold`
          );
        }
      },
      get error() {
        if (getLogLevel() > 4) {
          return noOp;
        } else {
          const label = `%c${tag}`;
          return console.error.bind(
            console,
            label,
            `color:${hash(label)};font-weight:bold`
          );
        }
      },

      get(key?: string) {
        if (key == null) {
          return state;
        } else {
          return state[key];
        }
      },

      set(...args: any) {
        if (typeof args[0] === "string") {
          // key, value
          state[args[0]] = args[1];
        } else if (typeof args[0] === "function") {
          // (currentState) => newState
          const result = args[0](state);
          if (!(typeof result === "object" && !Array.isArray(result))) {
            throw new TypeError(
              `Set functions must return a new state object.`
            );
          }
          for (const key in state) {
            if (!result.hasOwnProperty(key)) {
              delete state[key];
            }
          }
          Object.assign(state, result);
        } else if (typeof args[0] === "object" && !Array.isArray(args[0])) {
          // { key1: value1, key2: value2 }
          Object.assign(state, args[0]);
        }

        self._render();
      },

      on(
        event: string,
        callback: (e: unknown) => void,
        options?: boolean | AddEventListenerOptions
      ) {
        self.addEventListener(event, callback, options);

        return function off() {
          self.removeEventListener(event, callback, options);
        };
      },

      emit(event: string, detail?: any) {
        self.dispatchEvent(
          new CustomEvent(event, { detail, bubbles: true, cancelable: true })
        );
      },

      render(callback) {
        self._renderCallback = callback;
      },

      styles(callback) {
        self._stylesCallback = callback;
      },
    };
  }

  connectedCallback() {
    this._fn(this._context);

    if (!this._renderCallback) {
      throw new Error(
        `Element must have a render function. Got: ${this._renderCallback}`
      );
    }

    this._initialized = true;
    this._render();

    this.dispatchEvent(
      new CustomEvent("connect", {
        bubbles: false,
      })
    );
  }

  disconnectedCallback() {
    this._disconnect?.();

    this.dispatchEvent(
      new CustomEvent("disconnect", {
        bubbles: false,
      })
    );
  }

  attributeChangedCallback(
    property: keyof Attrs,
    oldValue: any,
    newValue: any
  ) {
    this._attributes[property] = newValue;
    this._render();
  }

  _render() {
    if (!this._initialized) return;

    const exposedAttrs: any = {};

    for (const name in this._attributes) {
      if (!name.startsWith("on")) {
        exposedAttrs[name] = this._attributes[name];
      }
    }

    const children = this.shadowRoot!.childNodes;
    const rendered = this._renderCallback(this._state, exposedAttrs);

    if (this._stylesCallback) {
      const styles = this._stylesCallback(this._state, exposedAttrs);

      if (this._styleElement) {
        if (this._styleElement.textContent !== styles) {
          this._styleElement.textContent = styles;
        }
      } else {
        this._styleElement = document.createElement("style");
        if (this._styleElement.textContent !== styles) {
          this._styleElement.textContent = styles;
        }
        this.shadowRoot!.appendChild(this._styleElement);
      }
    }

    let next: VNode[] = [];
    if (rendered != null) {
      if (Array.isArray(rendered)) {
        next = rendered;
      } else {
        next = [rendered];
      }
    }

    this._patch(
      this.shadowRoot!,
      [...children].filter((c) => c !== this._styleElement),
      next
    );
  }

  _patch(root: Node, children: Node[], next: VNode[]) {
    const length = Math.max(children.length, next.length);

    for (let i = 0; i < length; i++) {
      const dom = children[i];
      const vnode = next[i];

      if (!dom && vnode) {
        // item was added
        const node = this._createNode(vnode);
        root.appendChild(node);
      } else if (dom && !vnode) {
        // item was removed
        dom.parentNode?.removeChild(dom);
      } else if (dom instanceof Text && vnode.type === "@text") {
        // update text
        dom.textContent = vnode.attributes.value;
      } else if (
        dom instanceof Element &&
        dom.tagName.toLowerCase() === vnode.type
      ) {
        this._updateNode(dom, vnode);
      } else {
        // replace
        const node = this._createNode(vnode);
        root.insertBefore(node, dom.nextSibling);
        dom.parentNode?.removeChild(dom);
      }
    }
  }

  _createNode(node: VNode): Node {
    if (node.type === "@text") {
      return document.createTextNode(node.attributes.value);
    }

    const el = document.createElement(node.type);

    if (node.attributes) {
      for (const name in node.attributes) {
        if (name === "ref") {
          node.attributes[name](el);
        } else if (name.startsWith("on")) {
          let attr: any;

          if (typeof node.attributes[name] === "string") {
            attr = (0, eval)(node.attributes[name]);
          } else {
            attr = node.attributes[name];
          }

          console.log(name, attr);

          el.addEventListener(name.slice(2), node.attributes[name]);
        } else {
          el.setAttribute(name, node.attributes[name]);
        }
      }
    }

    if (node.children) {
      const children = this._toVNodes(node.children).map((c) =>
        this._createNode(c)
      );

      for (const child of children) {
        el.appendChild(child);
      }
    }

    return el;
  }

  _updateNode(current: Element, next: VNode) {
    const currentAttrs = current.getAttributeNames().reduce((attrs, name) => {
      attrs[name] = current.getAttribute(name);
      return attrs;
    }, {} as any);

    const nextAttrs = next.attributes ?? {};

    // remove attrs that are no longer present
    for (const name in currentAttrs) {
      if (!nextAttrs.hasOwnProperty(name)) {
        current.removeAttribute(name);
      }
    }

    for (const name in nextAttrs) {
      if (currentAttrs[name] !== nextAttrs[name]) {
        if (name.startsWith("on")) {
          // TODO: I don't think this is removing the old listener. If you define new functions inside render they keep stacking.
          current.removeEventListener(name.slice(2), currentAttrs[name]);

          let attr: any;

          if (typeof nextAttrs[name] === "string") {
            attr = (0, eval)(nextAttrs[name]);
          } else {
            attr = nextAttrs[name];
          }

          current.addEventListener(name.slice(2), attr);
        } else {
          current.setAttribute(name, nextAttrs[name]);
        }
      }
    }

    this._patch(
      current,
      [...current.childNodes],
      this._toVNodes(next.children)
    );
  }

  _toVNodes(nodes: (VNode | string | number | boolean)[]) {
    return nodes
      .filter((c) => c != null && c !== false)
      .map((c) => {
        if (
          typeof c === "string" ||
          typeof c === "number" ||
          typeof c === "boolean"
        ) {
          return {
            type: "@text",
            attributes: { value: String(c) },
            children: [],
          } as VNode;
        }

        if (typeof c.type === "string" && c.hasOwnProperty("attributes")) {
          return c;
        }

        throw new TypeError(`Unexpected child type: ${c}`);
      });
  }
}

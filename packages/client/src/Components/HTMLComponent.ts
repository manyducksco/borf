import { Bindable, Listenable, Stringifyable } from "../Source";
import { isBinding, isBoolean, isListenable, isString } from "../utils";
import { Component } from "./Component";
import { getClassMap } from "./utils/getClassMap";
import { toSameType } from "./utils/toSameType";

// Any props in this list will NOT be forwarded to the DOM node.
// These can be component-specific props or props that need special handling to apply.
const customProps = [
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
  "contentEditable",
  "draggable",
  "hidden",
  "spellCheck",
  "autoComplete",
  "autoFocus",
  "translate",
];

const eventRegex = /^on[A-Z]/;

/**
 * Classes can be in a variety of formats:
 *
 * ElementClass = "classname"
 * ElementClassObject = {
 *   "classname": true,
 *   "otherclass": false
 * }
 * ElementClassArray = ["classname", ["otherclass"], {
 *   "active": true
 * }]
 */
export type ElementClasses =
  | ElementClass
  | ElementClassObject
  | ElementClassArray;
type ElementClass = string | undefined | null | false;
type ElementClassObject = {
  [className: string]: unknown | Listenable<unknown>;
};
type ElementClassArray = Array<
  ElementClass | ElementClassObject | ElementClassArray
>;

export interface HTMLComponentProps {
  /**
   * List of child components
   */
  children?: Array<Component | string>;

  /**
   * String / class map object / array of strings, falsy values or class map objects
   */
  class?: ElementClasses;

  value?: Stringifyable | Bindable<Stringifyable> | Listenable<Stringifyable>;

  style?: CSSProps;

  type?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;

  disabled?: boolean | Listenable<boolean>;

  /**
   * Keyboard shortcut to activate or add focus to the element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey
   */
  accessKey?: string;

  contentEditable?: boolean | Listenable<boolean>;

  draggable?: boolean | Listenable<boolean>;

  hidden?: boolean | Listenable<boolean>;

  id?: string;

  lang?: string | Listenable<string>;

  spellCheck?: boolean | Listenable<boolean>;

  autoComplete?: boolean | Listenable<boolean>;

  autoFocus?: boolean | Listenable<boolean>;

  title?: string | Listenable<string>;

  translate?: boolean | Listenable<boolean>;

  tabIndex?: number | Listenable<number>;

  /**
   * Data attributes. Any keys in this object will be appended to 'data-' and added to the element.
   * e.g. `{ "test": 5 }` will generate `data-test="5"` on the element.
   */
  data?: {
    [key: string]: Stringifyable;
  };

  // Event handlers
  onClick?: (event: MouseEvent) => any;
  onMouseDown?: (event: MouseEvent) => any;
  onMouseUp?: (event: MouseEvent) => any;
  onKeyDown?: (event: KeyboardEvent) => any;
  onKeyUp?: (event: KeyboardEvent) => any;
  onChange?: (event: InputEvent) => any;
  onInput?: (event: InputEvent) => any;

  // Component lifecycle
  beforeConnect?: () => void; // runs just before component is added to DOM
  connected?: () => void; // runs just after component is added to DOM
  beforeDisconnect?: () => void; // runs just before component is added to DOM
  disconnected?: () => void; // runs just after component is added to DOM
}

type ListenableProps<T> = {
  [attr in keyof T as Exclude<attr, "length" | "parentRule">]:
    | T[attr]
    | Listenable<T[attr]>;
};

type CSSProps = Partial<ListenableProps<CSSStyleDeclaration>>;

export class TextNodeComponent extends Component {
  constructor(private value: string) {
    super();
  }

  createElement() {
    return document.createTextNode(this.value);
  }
}

export class HTMLComponent extends Component {
  declare element: HTMLElement;
  protected props: Readonly<HTMLComponentProps>;
  protected children: Component[] = [];
  protected cancellers: Array<() => void> = [];

  constructor(protected tagName: string, props?: HTMLComponentProps) {
    super();

    this.props = Object.freeze(props ?? {});

    if (this.props.children) {
      this.children = this.props.children.map((child) => {
        if (isString(child)) {
          return new TextNodeComponent(child);
        }

        return child;
      });
    }
  }

  createElement() {
    return document.createElement(this.tagName);
  }

  beforeConnect() {
    const { props, element: root, children } = this;

    let previous = null;

    for (const child of children) {
      child.connect(root, previous?.element);
      previous = child;
    }

    this.attachBindings();
    this.applyAttrs();
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

  private attachEvents() {
    for (const key in this.props) {
      if (eventRegex.test(key)) {
        const eventName = key.slice(2).toLowerCase();
        const listener = this.props[
          key as keyof HTMLComponentProps
        ] as EventListenerOrEventListenerObject;

        this.element.addEventListener(eventName, listener);

        this.cancellers.push(() => {
          this.element.removeEventListener(eventName, listener);
        });
      }
    }
  }

  private attachBindings() {
    if (this.element instanceof HTMLInputElement) {
      if (isBinding<Stringifyable>(this.props.value)) {
        const binding = this.props.value;

        this.element.value = binding.get().toString();
        const cancel = binding.listen((value) => {
          (this.element as HTMLInputElement).value = value.toString();
        });

        // Set the value back after converting to the subscription's type
        this.element.addEventListener("input", (e) => {
          binding.set(toSameType(binding.get(), (e.target as any).value));
        });

        this.cancellers.push(cancel);
      } else if (isListenable<Stringifyable>(this.props.value)) {
        const listenable = this.props.value;

        const cancel = listenable.listen((value: Stringifyable) => {
          (this.element as HTMLInputElement).value = value.toString();
        });

        this.element.value = listenable.current.toString();

        this.cancellers.push(cancel);
      }
    }
  }

  private applyClasses() {
    if (this.element instanceof HTMLElement) {
      if (this.props.class) {
        const mapped = getClassMap(this.props.class);

        for (const name in mapped) {
          const value = mapped[name];

          if (isBoolean(value)) {
            if (value) {
              this.element.classList.add(name);
            }
          }

          if (isListenable<boolean>(value)) {
            this.listenTo(value, (value, root) => {
              if (value) {
                root.classList.add(name);
              } else {
                root.classList.remove(name);
              }
            });
          }
        }
      }
    }
  }

  private applyStyles() {
    if (this.element instanceof HTMLElement) {
      if (this.props.style) {
        for (const name in this.props.style) {
          const prop = this.props.style[name];

          if (isString(prop)) {
            this.element.style[name] = prop;
          } else if (isListenable<string>(prop)) {
            this.listenTo(prop, (value, root) => {
              root.style[name] = value;
            });
          }
        }
      }
    }
  }

  private applyAttrs() {
    if (this.element instanceof HTMLElement) {
      for (const name in this.props) {
        if (!customProps.includes(name) && !eventRegex.test(name)) {
          const attr = this.props[name as keyof HTMLComponentProps];

          if (booleanProps.includes(name)) {
            if (isListenable<boolean>(attr)) {
              this.listenTo(attr, (value, root) => {
                if (value) {
                  root.setAttribute(name, "");
                } else {
                  root.removeAttribute(name);
                }
              });
            } else if (attr) {
              this.element.setAttribute(name, "");
            }
          } else {
            if (isListenable<Stringifyable>(attr)) {
              this.listenTo(attr, (value, root) => {
                root.setAttribute(name, value.toString());
              });
            } else if (attr) {
              this.element.setAttribute(name, String(attr));
            }
          }
        }
      }
    }
  }

  private listenTo<T>(
    source: Listenable<T>,
    callback: (value: T, root: HTMLElement) => void
  ) {
    const root = this.element as HTMLElement;

    const cancel = source.listen((value) => {
      requestAnimationFrame(() => {
        callback(value, root);
      });
    });

    this.cancellers.push(cancel);

    callback(source.current, root);
  }
}

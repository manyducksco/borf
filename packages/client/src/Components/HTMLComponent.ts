import { Binding, Stringifyable, Subscribable, Subscription } from "../types";
import { isBinding, isBoolean, isString, isSubscribable } from "../utils";
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
  [className: string]: unknown | Subscription<unknown>;
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

  value?: Stringifyable | Binding<Stringifyable> | Subscribable<Stringifyable>;

  style?: CSSProps;

  type?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;

  disabled?: boolean | Subscribable<boolean>;

  /**
   * Keyboard shortcut to activate or add focus to the element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey
   */
  accessKey?: string;

  contentEditable?: boolean | Subscribable<boolean>;

  draggable?: boolean | Subscribable<boolean>;

  hidden?: boolean | Subscribable<boolean>;

  id?: string;

  lang?: string | Subscribable<string>;

  spellCheck?: boolean | Subscribable<boolean>;

  autoComplete?: boolean | Subscribable<boolean>;

  autoFocus?: boolean | Subscribable<boolean>;

  title?: string | Subscribable<string>;

  translate?: boolean | Subscribable<boolean>;

  tabIndex?: number | Subscribable<number>;

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

type SubscribableProps<T> = {
  [attr in keyof T as Exclude<attr, "length" | "parentRule">]:
    | T[attr]
    | Subscribable<T[attr]>;
};

type CSSProps = Partial<SubscribableProps<CSSStyleDeclaration>>;

export class TextNodeComponent extends Component {
  declare root: Text;

  constructor(value: string) {
    super(document.createTextNode(value));
  }
}

export class HTMLComponent extends Component {
  declare root: HTMLElement;
  protected props: Readonly<HTMLComponentProps>;
  protected children: Component[] = [];
  protected subCancellers: Array<() => void> = [];
  protected eventCancellers: Array<() => void> = [];

  constructor(tagName: string, props?: HTMLComponentProps) {
    super(document.createElement(tagName));

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

  beforeConnect() {
    const { props, root, children } = this;

    let previous = null;

    for (const child of children) {
      child.connect(root, previous?.root);
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

    // Cancel active subscriptions
    for (const cancel of this.subCancellers) {
      cancel();
    }

    // Cancel event listeners
    for (const cancel of this.eventCancellers) {
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

        this.root.addEventListener(eventName, listener);

        this.eventCancellers.push(() => {
          this.root.removeEventListener(eventName, listener);
        });
      }
    }
  }

  private attachBindings() {
    if (this.root instanceof HTMLInputElement) {
      if (isBinding<Stringifyable>(this.props.value)) {
        const { initialValue, receiver, set } = this.props.value;

        this.root.value = initialValue.toString();
        receiver.callback = (value) => {
          (this.root as HTMLInputElement).value = value.toString();
        };

        // Set the value back after converting to the subscription's type
        this.root.addEventListener("input", (e) => {
          set(toSameType(initialValue, (e.target as any).value));
        });

        this.subCancellers.push(receiver.cancel.bind(receiver));
      } else if (isSubscribable<Stringifyable>(this.props.value)) {
        const sub = this.props.value.subscribe();

        this.root.value = sub.initialValue.toString();

        sub.receiver.callback = (value) => {
          (this.root as HTMLInputElement).value = value.toString();
        };

        this.subCancellers.push(sub.receiver.cancel.bind(sub.receiver));
      }
    }
  }

  private applyClasses() {
    if (this.root instanceof HTMLElement) {
      if (this.props.class) {
        const mapped = getClassMap(this.props.class);

        for (const name in mapped) {
          const value = mapped[name];

          if (isBoolean(value)) {
            if (value) {
              this.root.classList.add(name);
            }
          }

          if (isSubscribable<boolean>(value)) {
            this.subscribeTo(value, (value, root) => {
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
    if (this.root instanceof HTMLElement) {
      if (this.props.style) {
        for (const name in this.props.style) {
          const prop = this.props.style[name];

          if (isString(prop)) {
            this.root.style[name] = prop;
          } else if (isSubscribable<string>(prop)) {
            this.subscribeTo(prop, (value, root) => {
              root.style[name] = value;
            });
          }
        }
      }
    }
  }

  private applyAttrs() {
    if (this.root instanceof HTMLElement) {
      for (const name in this.props) {
        if (!customProps.includes(name) && !eventRegex.test(name)) {
          const attr = this.props[name as keyof HTMLComponentProps];

          if (booleanProps.includes(name)) {
            if (isSubscribable<boolean>(attr)) {
              this.subscribeTo(attr, (value, root) => {
                if (value) {
                  root.setAttribute(name, "");
                } else {
                  root.removeAttribute(name);
                }
              });
            } else if (attr) {
              this.root.setAttribute(name, "");
            }
          } else {
            if (isSubscribable<Stringifyable>(attr)) {
              this.subscribeTo(attr, (value, root) => {
                root.setAttribute(name, value.toString());
              });
            } else if (attr) {
              this.root.setAttribute(name, String(attr));
            }
          }
        }
      }
    }
  }

  private subscribeTo<T>(
    source: Subscribable<T>,
    callback: (value: T, root: HTMLElement) => void
  ) {
    const root = this.root as HTMLElement;
    const sub = source.subscribe();

    sub.receiver.callback = (value) => {
      requestAnimationFrame(() => {
        callback(value, root);
      });
    };

    sub.receiver.callback(sub.initialValue);

    this.subCancellers.push(sub.receiver.cancel.bind(sub.receiver));
  }
}

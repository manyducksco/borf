import { Binding, Stringifyable, Subscribable, Subscription } from "../types";
import {
  isArray,
  isBinding,
  isBoolean,
  isObject,
  isString,
  isSubscribable,
  isSubscription,
} from "../utils";

// All props in this list will be forwarded verbatim to DOM node
const forwardProps: (keyof BaseComponentProps)[] = [
  "type",
  "min",
  "max",
  "step",
];

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

export interface BaseComponentProps {
  /**
   * List of child components
   */
  children?: Component[];

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

  // Event handlers
  onClick?: (event: MouseEvent) => any;
  onMouseDown?: (event: MouseEvent) => any;
  onMouseUp?: (event: MouseEvent) => any;
  onKeyDown?: (event: KeyboardEvent) => any;
  onKeyUp?: (event: KeyboardEvent) => any;
  onChange?: (event: InputEvent) => any;
  onInput?: (event: InputEvent) => any;

  // Component lifecycle
  onMount?: () => void; // runs just after component is added to DOM
  onUnmount?: () => void; // runs just after component is removed from DOM
}

type SubscribableProps<T> = {
  [attr in keyof T as Exclude<attr, "length" | "parentRule">]:
    | T[attr]
    | Subscribable<T[attr]>;
};

type CSSProps = Partial<SubscribableProps<CSSStyleDeclaration>>;

// document.createElement("div").style.marginRight = "5px"

export interface Component {
  root: Node;
  mount(parent: Node, after?: Node): void;
  unmount(): void;
  isMounted: boolean;
}

export class BaseComponent implements Component {
  root: Node;
  props: Readonly<BaseComponentProps>;
  key?: string | number;

  get isMounted() {
    return this.root.parentNode != null;
  }

  constructor(root: Node, props?: BaseComponentProps) {
    this.root = root;
    this.props = Object.freeze(props ?? {});

    this.applyClasses();
    this.applyStyles();
    this.attachEvents();
    this.attachBindings();
    this.applyAttrs();
  }

  mount(parent: Node, after?: Node) {
    const { children, onMount } = this.props;
    const isMounted = this.isMounted;

    // mount can be used to move a node while already mounted
    // in this case we don't need to mount children or run lifecycle hooks
    if (!isMounted && children) {
      let previous = null;
      for (const child of children) {
        child.mount(this.root, previous?.root);
        previous = child;
      }
    }

    parent.insertBefore(this.root, after ? after.nextSibling : null);

    if (!isMounted && onMount) {
      onMount();
    }
  }

  unmount() {
    const { children, onUnmount } = this.props;

    if (this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }

    if (children) {
      for (const child of children) {
        child.unmount();
      }
    }

    if (onUnmount) {
      onUnmount();
    }
  }

  private attachEvents() {
    for (const key in this.props) {
      if (key === "onMount" || key === "onUnmount") {
        continue;
      }

      if (/^on[A-Z][a-zA-Z]+$/.test(key)) {
        const eventName = key.slice(2).toLowerCase();

        this.root.addEventListener(
          eventName,
          this.props[
            key as keyof BaseComponentProps
          ] as EventListenerOrEventListenerObject
        );
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
          (this.props.value! as Binding<Stringifyable>).set(
            toSameType(initialValue, (e.target as any).value)
          );
        });
      } else if (isSubscribable<Stringifyable>(this.props.value)) {
        const sub = this.props.value.subscribe();
        this.root.value = sub.initialValue.toString();
        sub.receiver.callback = (value) => {
          (this.root as HTMLInputElement).value = value.toString();
        };
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
      for (const name of forwardProps) {
        const attr = this.props[name];

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
  }
}

function getClassMap(classData: unknown) {
  let mapped: {
    [className: string]: boolean | Subscription<boolean>;
  } = {};

  if (isString(classData)) {
    mapped[classData] = true;
  } else if (isObject(classData)) {
    mapped = {
      ...mapped,
      ...classData,
    };
  } else if (isArray<any>(classData)) {
    Array.from(classData).forEach((item) => {
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
function toSameType(target: any, source: any) {
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

import { Binding, Subscription } from "../types";
import {
  isArray,
  isBinding,
  isBoolean,
  isObject,
  isString,
  isSubscription,
} from "../utils";

export interface BaseComponentProps {
  /**
   * List of child components
   */
  children?: BaseComponent[];

  /**
   * String / class map object / array of strings, falsy values or class map objects
   */
  class?:
    | string
    | Array<
        | string
        | null
        | undefined
        | false
        | 0
        | { [className: string]: unknown | Subscription<unknown> }
      >
    | {
        [className: string]: unknown | Subscription<unknown>;
      };

  value?: Binding<string> | Subscription<string>;

  onClick?: (event: MouseEvent) => any;
  onMouseDown?: (event: MouseEvent) => any;
  onMouseUp?: (event: MouseEvent) => any;
  onKeyDown?: (event: KeyboardEvent) => any;
  onKeyUp?: (event: KeyboardEvent) => any;
  onChange?: (event: InputEvent) => any;
}

export interface Component<T> {
  root: Node;
  props: T;

  mount(parent: Node, after?: Node): void;
  unmount(): void;
}

export class BaseComponent implements Component<BaseComponentProps> {
  root: Node;
  props: Readonly<BaseComponentProps>;
  key?: string | number;

  constructor(root: Node, props?: BaseComponentProps) {
    this.root = root;
    this.props = Object.freeze(props ?? {});

    this.applyClasses();
    this.attachEvents();
    this.attachBindings();
  }

  mount(parent: Node, after?: Node) {
    const { children } = this.props;

    if (children) {
      for (const child of children) {
        child.mount(this.root);
      }
    }

    parent.insertBefore(this.root, after ? after.nextSibling : null);
  }

  unmount() {
    const { children } = this.props;

    if (this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }

    if (children) {
      for (const child of children) {
        child.unmount();
      }
    }
  }

  private attachEvents() {
    for (const key in this.props) {
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
      if (isSubscription<string>(this.props.value)) {
        this.root.value = this.props.value.current;
        this.props.value.receiver.callback = (value) => {
          (this.root as HTMLInputElement).value = value;
        };

        if (isBinding<string>(this.props.value)) {
          this.root.addEventListener("input", (e) => {
            (this.props.value! as Binding<string>).set((e.target as any).value);
          });
        }
      }
    }
  }

  private applyClasses() {
    if (this.root instanceof HTMLElement) {
      if (this.props.class) {
        const mapped = getClassMap(this.props.class);

        for (const name in mapped) {
          if (isBoolean(mapped[name])) {
            if (mapped[name]) {
              this.root.classList.add(name);
            }
          }

          if (isSubscription<boolean>(mapped[name])) {
            this.bindClass(name, mapped[name] as Subscription<boolean>);
          }
        }

        console.log(mapped);
      }
    }
  }

  private bindClass(name: string, sub: Subscription<boolean>) {
    const root = this.root as HTMLElement;

    sub.receiver.callback = (value) => {
      console.log(name, value, sub);
      if (value) {
        root.classList.add(name);
      } else {
        root.classList.remove(name);
      }
    };

    sub.receiver.callback(sub.current);
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

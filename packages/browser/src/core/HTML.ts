import { isFunction, isNumber, isObject, isString } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "./App.js";
import { isRef } from "./Ref.js";
import {
  readable,
  writable,
  isReadable,
  isWritable,
  type Readable,
  type Writable,
  type StopFunction,
} from "./state.js";
import { omit } from "./utils/omit.js";
import { renderMarkupToDOM, type DOMHandle, type Markup } from "./markup.js";
//import { eventPropsToEventNames } from "./types.js";

//const eventHandlerProps = Object.values(eventPropsToEventNames).map((event) => "on" + event);
const isCamelCaseEventName = (key: string) => /^on[A-Z]/.test(key);

type HTMLOptions = {
  appContext: AppContext;
  elementContext: ElementContext;
  tag: string;
  props?: any;
  children?: Markup[];
};

export class HTML implements DOMHandle {
  node;
  props: Record<string, any>;
  children: DOMHandle[];
  stopCallbacks: StopFunction[] = [];
  appContext;
  elementContext;

  // Prevents 'onClickOutside' handlers from firing in the same cycle in which the element is connected.
  canClickAway = false;

  get connected() {
    return this.node.parentNode != null;
  }

  constructor({ tag, props, children, appContext, elementContext }: HTMLOptions) {
    elementContext = { ...elementContext };

    // This and all nested views will be created as SVG elements.
    if (tag.toLowerCase() === "svg") {
      elementContext.isSVG = true;
    }

    // Create node with the appropriate constructor.
    if (elementContext.isSVG) {
      this.node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    } else {
      this.node = document.createElement(tag);
    }

    // Set ref if present. Refs can be a Ref object or a function that receives the node.
    if (props.ref) {
      if (isRef(props.ref)) {
        props.ref.current = this.node;
      } else {
        throw new Error("Expected an instance of Ref. Got: " + props.ref);
      }
    }

    this.props = {
      ...omit(["ref", "class", "className"], props),
      class: props.className ?? props.class,
    };
    this.children = children ? renderMarkupToDOM(children, { appContext, elementContext }) : [];

    this.appContext = appContext;
    this.elementContext = elementContext;
  }

  async connect(parent: Node, after?: Node) {
    if (parent == null) {
      throw new Error(`HTML element requires a parent element as the first argument to connect. Got: ${parent}`);
    }

    if (!this.connected) {
      for (const child of this.children) {
        await child.connect(this.node);
      }

      this.applyProps(this.node, this.props);
      if (this.props.style) this.applyStyles(this.node, this.props.style, this.stopCallbacks);
      if (this.props.class) this.applyClasses(this.node, this.props.class, this.stopCallbacks);
    }

    parent.insertBefore(this.node, after?.nextSibling ?? null);

    setTimeout(() => {
      this.canClickAway = true;
    }, 0);
  }

  async disconnect() {
    if (this.connected) {
      for (const child of this.children) {
        await child.disconnect();
      }

      this.node.parentNode?.removeChild(this.node);

      this.canClickAway = false;

      for (const stop of this.stopCallbacks) {
        stop();
      }
      this.stopCallbacks = [];
    }
  }

  async setChildren(next: DOMHandle[]) {
    const current = this.children;
    const patched: DOMHandle[] = [];
    const length = Math.max(current.length, next.length);

    for (let i = 0; i < length; i++) {
      if (!current[i] && next[i]) {
        // item was added
        patched[i] = next[i];
        await patched[i].connect(this.node, patched[i - 1]?.node);
      } else if (current[i] && !next[i]) {
        // item was removed
        current[i].disconnect();
      } else if (current[i] != next[i]) {
        // item was replaced
        patched[i] = next[i];
        current[i].disconnect();
        await patched[i].connect(this.node, patched[i - 1]?.node);
      }
    }

    this.children = patched;
  }

  applyProps(element: HTMLElement | SVGElement, props: Record<string, unknown>) {
    const attachProp = <T>(value: Readable<T> | T, callback: (value: T) => void) => {
      if (isReadable(value)) {
        this.stopCallbacks.push(value.observe(callback));
      } else {
        callback(value);
      }
    };

    if (this.elementContext.isSVG) {
      for (const key in props) {
        if (!privateProps.includes(key)) {
          attachProp(props[key], (current) => {
            if (current != null) {
              element.setAttribute(key, String(props[key]));
            } else {
              element.removeAttribute(key);
            }
          });
        }
      }
      return;
    }

    for (const key in props) {
      const value = props[key];

      if (key === "attributes") {
        const values = value as Record<string, any>;
        // Set attributes directly without mapping props
        for (const name in values) {
          attachProp(values[name], (current) => {
            if (current == null) {
              (element as any).removeAttribute(name);
            } else {
              (element as any).setAttribute(name, String(current));
            }
          });
        }
      } else if (key === "eventListeners") {
        const values = value as Record<string, any>;

        for (const name in values) {
          const listener: (e: Event) => void = isReadable<(e: Event) => void>(value)
            ? (e: Event) => value.get()(e)
            : (value as (e: Event) => void);

          element.addEventListener(name, listener);

          this.stopCallbacks.push(() => {
            element.removeEventListener(name, listener);
          });
        }
      } else if (key === "$$value") {
        if (!isWritable(value)) {
          throw new TypeError(`$$value property must be a Writable. Got: ${value} (${typeof value})`);
        }

        attachProp(value, (current) => {
          (element as any).value = String(current);
        });

        const listener: EventListener = (e) => {
          const updated = toTypeOf(value.get(), (e.currentTarget as HTMLInputElement).value);
          value.set(updated);
        };

        element.addEventListener("input", listener);

        this.stopCallbacks.push(() => {
          element.removeEventListener("input", listener);
        });
      } else if (key === "onClickOutside" || key === "onclickoutside") {
        const listener = (e: Event) => {
          if (this.canClickAway && !element.contains(e.target as any)) {
            if (isReadable<(e: Event) => void>(value)) {
              value.get()(e);
            } else {
              (value as (e: Event) => void)(e);
            }
          }
        };

        const options = { capture: true };

        window.addEventListener("click", listener, options);

        this.stopCallbacks.push(() => {
          window.removeEventListener("click", listener, options);
        });
      } else if (isCamelCaseEventName(key)) {
        const eventName = key.slice(2).toLowerCase();

        const listener: (e: Event) => void = isReadable<(e: Event) => void>(value)
          ? (e: Event) => value.get()(e)
          : (value as (e: Event) => void);

        element.addEventListener(eventName, listener);

        this.stopCallbacks.push(() => {
          element.removeEventListener(eventName, listener);
        });
      } else if (key.includes("-")) {
        // Names with dashes in them are not valid prop names, so they are treated as attributes.
        attachProp(value, (current) => {
          if (current == null) {
            element.removeAttribute(key);
          } else {
            element.setAttribute(key, String(current));
          }
        });
      } else if (!privateProps.includes(key)) {
        switch (key) {
          case "contentEditable":
          case "value":
            attachProp(value, (current) => {
              (element as any)[key] = String(current);
            });
            break;

          case "for":
            attachProp(value, (current) => {
              (element as any).htmlFor = current;
            });
            break;

          // Attribute-aliased props
          case "exportParts":
          case "part":
          case "translate": {
            const _key = key.toLowerCase();
            attachProp(value, (current) => {
              if (current == undefined) {
                element.removeAttribute(_key);
              } else {
                element.setAttribute(_key, String(current));
              }
            });
            break;
          }

          case "autocomplete":
          case "autocapitalize":
            attachProp(value, (current) => {
              if (typeof current === "string") {
                (element as any).autocomplete = current;
              } else if (current) {
                (element as any).autocomplete = "on";
              } else {
                (element as any).autocomplete = "off";
              }
            });
            break;

          default: {
            attachProp(value, (current) => {
              (element as any)[key] = current;
            });
            break;
          }
        }
      }
    }
  }

  applyStyles(element: HTMLElement | SVGElement, styles: Record<string, any>, stopCallbacks: StopFunction[]) {
    const propStopCallbacks: StopFunction[] = [];

    if (isReadable<object>(styles)) {
      let unapply: () => void;

      const stop = styles.observe((current) => {
        requestAnimationFrame(() => {
          if (isFunction(unapply)) {
            unapply();
          }
          element.style.cssText = "";
          unapply = this.applyStyles(element, current, stopCallbacks);
        });
      });

      stopCallbacks.push(stop);
      propStopCallbacks.push(stop);
    } else if (isObject(styles)) {
      styles = styles as Record<string, any>;

      for (const key in styles) {
        const value = styles[key];

        // Set style property or attribute.
        const setProperty = key.startsWith("--")
          ? (key: string, value: string | null) => element.style.setProperty(key, value)
          : (key: string, value: string | null) => (element.style[key as any] = value ?? "");

        if (isReadable<any>(value)) {
          const stop = value.observe((current) => {
            if (current) {
              setProperty(key, current);
            } else {
              element.style.removeProperty(key);
            }
          });

          stopCallbacks.push(stop);
          propStopCallbacks.push(stop);
        } else if (isString(value)) {
          setProperty(key, value);
        } else if (isNumber(value)) {
          setProperty(key, value + "px");
        } else {
          throw new TypeError(`Style properties should be strings, $states or numbers. Got (${key}: ${value})`);
        }
      }
    } else {
      throw new TypeError(`Expected style property to be a string, $state, or object. Got: ${styles}`);
    }

    return function unapply() {
      for (const stop of propStopCallbacks) {
        stop();
        stopCallbacks.splice(stopCallbacks.indexOf(stop), 1);
      }
    };
  }

  applyClasses(element: HTMLElement | SVGElement, classes: unknown, stopCallbacks: StopFunction[]) {
    const classStopCallbacks: StopFunction[] = [];

    if (isReadable(classes)) {
      let unapply: () => void;

      const stop = classes.observe((current) => {
        requestAnimationFrame(() => {
          if (isFunction(unapply)) {
            unapply();
          }
          element.removeAttribute("class");
          unapply = this.applyClasses(element, current, stopCallbacks);
        });
      });

      stopCallbacks.push(stop);
      classStopCallbacks.push(stop);
    } else {
      const mapped = getClassMap(classes);

      for (const name in mapped) {
        const value = mapped[name];

        if (isReadable(value)) {
          const stop = value.observe((current) => {
            if (current) {
              element.classList.add(name);
            } else {
              element.classList.remove(name);
            }
          });

          stopCallbacks.push(stop);
          classStopCallbacks.push(stop);
        } else if (value) {
          element.classList.add(name);
        }
      }
    }

    return function unapply() {
      for (const stop of classStopCallbacks) {
        stop();
        stopCallbacks.splice(stopCallbacks.indexOf(stop), 1);
      }
    };
  }
}

function getClassMap(classes: unknown) {
  let mapped: Record<string, boolean> = {};

  if (isString(classes)) {
    // Support multiple classes in one string like HTML.
    const names = classes.split(" ");
    for (const name of names) {
      mapped[name] = true;
    }
  } else if (isObject(classes)) {
    Object.assign(mapped, classes);
  } else if (Array.isArray(classes)) {
    Array.from(classes)
      .filter((item) => item != null)
      .forEach((item) => {
        Object.assign(mapped, getClassMap(item));
      });
  }

  return mapped;
}

/**
 * Attempts to convert `source` to the same type as `target`.
 * Returns `source` as-is if conversion is not possible.
 */
function toTypeOf<T>(target: T, source: unknown): T | unknown {
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

// Attributes in this list will not be forwarded to the DOM node.
const privateProps = ["ref", "children", "class", "style", "data"];

//const booleanAttrs = [
//  "allowfullscreen",
//  "async",
//  "autocomplete",
//  "autofocus",
//  "autoplay",
//  "checked",
//  "contenteditable",
//  "controls",
//  "default",
//  "defer",
//  "disabled",
//  "formnovalidate",
//  "hidden",
//  "ismap",
//  "itemscope",
//  "loop",
//  "multiple",
//  "muted",
//  "nomodule",
//  "open",
//  "playsinline",
//  "readonly",
//  "required",
//  "reversed",
//  "selected",
//  "spellcheck",
//  "translate",
//  "truespeed",
//];

import { State } from "../states/State";
import { isString, isElement } from "../utils";

type ElementOptions<StateShape> = {
  extends: Element<StateShape> | keyof HTMLElementTagNameMap;
  state?: State<StateShape>;
  children?: Array<Element<unknown> | string>;
};

export class Element<StateShape> {
  tag: keyof HTMLElementTagNameMap = "div";
  element!: Node;
  state?: State<StateShape>;
  children?: Element<unknown>[];

  constructor(options: ElementOptions<StateShape>) {
    this.state = options.state;
    this.setTag(options.extends);

    if (options.children && options.children.length > 0) {
      this.attachChildren(options.children);
    }
  }

  private setTag(element: Element<StateShape> | keyof HTMLElementTagNameMap) {
    if (isString(element)) {
      this.tag = element as keyof HTMLElementTagNameMap;
    } else if (isElement(element)) {
      this.tag = (element as Element<unknown>).tag;
      // TODO: inherit callbacks and attributes?
    } else {
      throw new Error(
        `options.extends expected an element or tag name but received: ${typeof element}`
      );
    }

    this.element = document.createElement(this.tag);
  }

  private attachChildren(children: Array<Element<unknown> | string>) {
    for (const child of children) {
      if (child == null) {
        continue;
      }

      if (isString(child)) {
        this.element.appendChild(document.createTextNode(child as string));
      } else if (isElement(child)) {
        this.element.appendChild((child as Element<unknown>).element);
      } else {
        throw new Error(`unknown type for child: ${typeof child}`);
      }
    }
  }
}

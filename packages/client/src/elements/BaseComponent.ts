export interface BaseComponentProps {
  /**
   * List of child components
   */
  children?: BaseComponent[];

  onClick?: (event: MouseEvent) => any;
  onMouseDown?: (event: MouseEvent) => any;
  onMouseUp?: (event: MouseEvent) => any;
  onKeyDown?: (event: KeyboardEvent) => any;
  onKeyUp?: (event: KeyboardEvent) => any;
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

    this.attachEvents();
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
}

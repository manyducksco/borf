export interface BaseComponentProps {
  /**
   * List of child components
   */
  children?: BaseComponent[];

  onClick?: (event: MouseEvent) => any;
}

export class BaseComponent {
  root: Node;
  props: Readonly<BaseComponentProps>;
  key?: string;

  constructor(root: Node, props?: BaseComponentProps) {
    this.root = root;
    this.props = Object.freeze(props ?? {});

    // TODO: apply props
    if (this.props.onClick) {
      // this is temporary for testing
      this.root.addEventListener("click", this.props.onClick as any);
    }
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
}

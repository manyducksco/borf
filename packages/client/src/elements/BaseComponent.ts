export interface BaseComponentProps {
  /**
   * List of child components
   */
  children?: BaseComponent[];
}

export class BaseComponent {
  root: Node;
  props: Readonly<BaseComponentProps>;
  key?: string;

  constructor(root: Node, props?: BaseComponentProps) {
    this.root = root;
    this.props = Object.freeze(props ?? {});

    // TODO: apply props
  }

  mount(parent: Node, after?: Node) {
    const { children } = this.props;

    if (children) {
      for (const child of children) {
        child.mount(this.root);
      }
    }

    if (after) {
      parent.insertBefore(this.root, after.nextSibling);
    } else {
      parent.appendChild(this.root);
    }
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

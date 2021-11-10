
import { HTTP } from "../http";

/**
 * The basic Component class. It can be connected and disconnected and supports lifecycle hooks.
 * It makes no assumptions about its element other than that it is a Node (which all DOM nodes are).
 */
export class Component {
  $root = document.createTextNode("");
  protected app!: AppInjectables;
  protected http!: HTTPClient;

  private $element: HTMLElement;

  get isConnected() {
    return this.$root.parentNode != null;
  }

  init($: dolla): $Node | $NodeFn {
    throw new Error(`Component is missing an init function`);
  }

  connect(parent: Node, after?: Node): void {
    if (!this.$element) {
      const value = this.init({});

      if (value instanceof Function) {
        this.$element = value({});
      } else {
        this.$element = value;
      }
    }

    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting. Connecting a connected component moves the node without unmounting.
    if (!wasConnected) {
      this.beforeConnect();
    }

    parent.insertBefore(this.$root, after ? after.nextSibling : null);

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect(): void {
    if (this.isConnected) {
      this.beforeDisconnect();

      if (this.$root.parentNode) {
        this.$root.parentNode.removeChild(this.$root);
      }

      if ()

      this.disconnected();

      this.$node = null;
    }
  }

  beforeConnect() {}
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}

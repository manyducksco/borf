/**
 * Base class for framework elements that can be connected to the DOM.
 */
// export class Connectable {
//   static isConnectable(value: any): value is Connectable {
//     return value != null && value.prototype instanceof Connectable;
//   }

//   get __node(): Node | undefined {
//     return undefined; // Override me. Should return a DOM node when the component is connected.
//   }

//   get __isConnected() {
//     return this.__node?.parentNode != null;
//   }

//   async __connect(parent: Node, after: Node | null = null) {
//     parent.insertBefore(this.__node!, after?.nextSibling ?? null);
//   }

//   async __disconnect() {
//     if (this.__isConnected) {
//       this.__node!.parentNode!.removeChild(this.__node!);
//     }
//   }
// }

export interface Connectable {
  readonly node: Node;
  readonly isConnected: boolean;

  connect(parent: Node, after?: Node): Promise<void>;
  disconnect(): Promise<void>;
}

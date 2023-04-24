export interface Connectable {
  readonly node: Node;
  readonly isConnected: boolean;

  connect(parent: Node, after?: Node): Promise<void>;
  disconnect(): Promise<void>;
}

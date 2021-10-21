import { Subscribable } from "../types";
import { Component } from "./Component";

export class MapComponent<T> extends Component {
  constructor(
    protected source: Subscribable<T[]>,
    protected getKey: (item: T) => string | number,
    protected createItem: (item: T) => Component
  ) {
    super(document.createTextNode(""));
  }
}

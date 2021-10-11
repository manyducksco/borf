import { BaseComponentProps, BaseComponent } from "./BaseComponent.js";

/*===========================*\
||       Basic Elements      ||
\*===========================*/

export const div = (props: BaseComponentProps) =>
  new BaseComponent(document.createElement("div"), props);

export const section = (props: BaseComponentProps) =>
  new BaseComponent(document.createElement("section"), props);

export const ul = (props: BaseComponentProps) =>
  new BaseComponent(document.createElement("ul"), props);

export const ol = (props: BaseComponentProps) =>
  new BaseComponent(document.createElement("ol"), props);

export const li = (props: BaseComponentProps) =>
  new BaseComponent(document.createElement("li"), props);

// class Component<PropTypes> extends BaseComponent {
//   constructor(props?: BaseComponentProps) {
//     super(new DocumentFragment(), props);
//   }

//   create(props: PropTypes) {
//     return [];
//   }

//   mount(parent: Node, after?: Node) {
//     super.mount(parent, after);
//   }

//   onMount() {
//     this.root;
//   }

//   onUnmount() {}
// }

// interface ToolbarProps {
//   left: BaseComponent[];
//   right: BaseComponent[];
// }

// class ToolbarComponent extends Component<ToolbarProps> {
//   create({ left, right }: ToolbarProps) {
//     return;
//   }
// }

/*===========================*\
||     Specialty Elements    ||
\*===========================*/

export * from "./text.js";
export * from "./map.js";
export * from "./when.js";

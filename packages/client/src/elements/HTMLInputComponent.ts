import { HTMLComponent, HTMLComponentProps } from "./HTMLComponent";

interface HTMLInputComponentProps extends HTMLComponentProps {}

class HTMLInputComponent extends HTMLComponent {
  declare root: HTMLInputElement;

  constructor(protected props: HTMLInputComponentProps) {
    super("input", props);
  }
}

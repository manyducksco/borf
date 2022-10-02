import { isFunction } from "../../helpers/typeChecking.js";
import { ViewBlueprint } from "./View.js";

export class TransitionsBlueprint {
  constructor(element, transitions) {
    this.transitions = transitions;

    if (isFunction(element)) {
      this.blueprint = new ViewBlueprint(element);
    } else if (element?.isBlueprint) {
      this.blueprint = element;
    }

    if (!this.blueprint.isBlueprint) {
      throw new TypeError(`Transitions can only be applied to an element or view.`);
    }
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext }) {
    return new TransitionsView(this.blueprint, this.transitions, appContext, elementContext);
  }
}

class TransitionsView {
  constructor(blueprint, transitions, appContext, elementContext) {
    this.view = blueprint.build({ appContext, elementContext });
    this.state = this.view.state;
    this.transitions = transitions;
    this.appContext = appContext;
    this.elementContext = {
      ...elementContext,
    };
  }

  get node() {
    return this.view.node;
  }

  get isConnected() {
    return this.view.isConnected;
  }

  get isView() {
    return true;
  }

  setChildren(children) {
    this.view.setChildren(children);
  }

  connect(parent, after = null) {
    if (this.transitions.in && !this.isConnected) {
      const ctx = {
        node: this.view.node,
        get: this.view.state?.get ?? (() => undefined),
        set: this.view.state?.set ?? (() => undefined),
        done: () => {},
      };

      this.view.connect(parent, after);

      const res = this.transitions.in(ctx);
      if (isFunction(res?.then)) {
        res.then(ctx.done);
      }
    } else {
      this.view.connect(parent, after);
    }
  }

  disconnect() {
    if (this.transitions.out) {
      const ctx = {
        node: this.view.node,
        get: this.view.state?.get ?? (() => undefined),
        set: this.view.state?.set ?? (() => undefined),
        done: () => {
          this.view.disconnect();
        },
      };

      const res = this.transitions.out(ctx);
      if (isFunction(res?.then)) {
        res.then(ctx.done);
      }
    } else {
      this.view.disconnect();
    }
  }
}

import { isFunction, isObject, isString } from "../../helpers/typeChecking.js";
import { ViewBlueprint } from "./View.js";
import { makeState } from "../../helpers/state.js";

export class TransitionsBlueprint {
  constructor(fn) {
    this.fn = fn;
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext, ...ctx }) {
    const element = null;

    console.log(ctx);

    return new TransitionsView({ fn: this.fn, appContext, elementContext });
  }
}

class TransitionsView {
  node = document.createComment("transitions");
  transitions = {
    enter: () => Promise.resolve(),
    exit: () => Promise.resolve(),
  };

  constructor({ fn, appContext, elementContext }) {
    this.$$state = makeState({});

    this.fn = fn;
    this.appContext = appContext;
    this.elementContext = {
      ...elementContext,
    };
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  get isView() {
    return true;
  }

  setChildren(children) {
    console.warn(`Tried to setChildren on a TransitionsView. This is not currently supported.`);
  }

  connect(parent, after = null) {
    let view;
    const { transitions } = this;

    console.log(this);

    const ctx = {
      get node() {
        return view?.node;
      },
      enter(fn) {
        transitions.enter = fn;
      },
      exit(fn) {
        transitions.exit = fn;
      },
      observe() {},
    };

    const transitionAttributes = this.fn(ctx);

    view = new OutletBlueprint().build({
      appContext: this.appContext,
      elementContext: this.elementContext,
      attributes: transitionAttributes,
    });

    if (transitions.enter && !this.isConnected) {
      const ctx = {
        node: this.view.node,
        done: () => {},
      };

      this.view.connect(parent, after);

      const res = transitions.enter(ctx);
      if (isFunction(res?.then)) {
        res.then(ctx.done);
      }
    } else {
      this.view.connect(parent, after);
    }
  }

  disconnect() {
    if (this.transitions.exit) {
      const res = this.transitions.exit();
      if (isFunction(res?.then)) {
        res.then(ctx.done);
      }
    } else {
      this.view.disconnect();
    }
  }
}

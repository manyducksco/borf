import { isFunction, isObject, isString } from "../../helpers/typeChecking.js";
import { ViewBlueprint } from "./View.js";
import { makeState } from "../../helpers/state.js";

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
    this.$$state = makeState({});

    this.view = blueprint.build({ appContext, elementContext, attributes: { $transition: this.$$state.readable() } });
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

  #set(key, value) {
    const entries = {};

    if (isString(key)) {
      entries[key] = value;
    } else if (isObject(key)) {
      Object.assign(entries, key);
    } else {
      throw new TypeError(`Set function expected a key or object as the first argument. Got: ${typeof key}`);
    }

    this.$$state.update((current) => {
      for (const [key, value] of Object.entries(entries)) {
        current[key] = value;
      }
    });
  }

  #get(key) {
    const state = this.$$state.get();

    if (key === undefined) {
      return state;
    }

    return state[key];
  }

  connect(parent, after = null) {
    if (this.transitions.enter && !this.isConnected) {
      const ctx = {
        node: this.view.node,
        get: this.#get.bind(this),
        set: this.#set.bind(this),
        done: () => {},
      };

      this.view.connect(parent, after);

      const res = this.transitions.enter(ctx);
      if (isFunction(res?.then)) {
        res.then(ctx.done);
      }
    } else {
      this.view.connect(parent, after);
    }
  }

  disconnect() {
    if (this.transitions.exit) {
      const ctx = {
        node: this.view.node,
        get: this.#get.bind(this),
        set: this.#set.bind(this),
        done: () => {
          this.view.disconnect();
        },
      };

      const res = this.transitions.exit(ctx);
      if (isFunction(res?.then)) {
        res.then(ctx.done);
      }
    } else {
      this.view.disconnect();
    }
  }
}

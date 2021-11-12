import { $Element } from "./$Element";
import { $Text } from "./$Text";
import { $Node } from "./$Node";
import { isObject, isString } from "./utils/typeChecking";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ app, http }) {
  function Dolla(element, defaultAttrs = {}) {
    let type = null;

    if (element.isComponent) {
      type = "component";
    } else if (isString(element)) {
      type = "element";
    } else {
      throw new TypeError(
        `Expected string or Component but received ${typeof element}`
      );
    }

    /**
     * @param args - Attributes object (optional) followed by any number of children
     */
    function create(...args) {
      let attributes = { ...defaultAttrs };
      let children = args;
      const firstArg = args[0];

      if (firstArg instanceof $Node == false && isObject(firstArg)) {
        attributes = children.shift();
      }

      children = children
        .filter((x) => x != null && x !== false)
        .map((child) => {
          if (child.isDolla) {
            return child();
          }

          return child;
        });

      let node;

      switch (type) {
        case "component":
          node = new element(attributes, children);
          node.app = app;
          node.http = http;
          node.$ = Dolla;
          return node;
        case "element":
          node = new $Element(element, attributes, children);
          node.app = app;
          node.http = http;
          return node;
      }
    }

    create.isDolla = true;

    return create;
  }

  Dolla.if = function (value, then, otherwise) {
    return new $If(value, then, otherwise);
  };

  Dolla.map = function (items, keyer, create) {
    return new $Map(items, keyer, create);
  };

  Dolla.text = function (value) {
    return new $Text(value);
  };

  Dolla.router = function () {
    return {
      route() {},
    };
  };

  return Dolla;
}

export class $If extends $Node {
  condition;
  component;
  unlisten;

  constructor(value, component) {
    super();
    this.condition = value;
    this.component = component;
  }

  update(value) {
    if (value && this.element?.parentNode) {
      this.component.connect(this.element.parentNode, this.element);
    } else {
      this.component.disconnect();
    }
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.condition(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.condition());
  }

  disconnected() {
    this.component.disconnect();

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}

class $Map extends $Node {
  source;
  getKey;
  createItem;
  unlisten;
  state = [];

  constructor(list, getKey, createItem) {
    super();
    this.source = list;
    this.getKey = getKey;
    this.createItem = createItem;
  }

  update(list) {
    if (!this.isConnected) {
      return;
    }

    const newKeys = list.map(this.getKey);
    const added = [];
    const removed = [];
    const moved = [];

    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      const tracked = this.state.find((item) => item.key === key);

      if (tracked) {
        if (tracked.index !== i) {
          moved.push({
            from: tracked.index,
            to: i,
            key,
          });
        }
      } else {
        added.push({ i, key });
      }
    }

    for (const tracked of this.state) {
      const stillPresent = newKeys.includes(tracked.key);

      if (!stillPresent) {
        removed.push({ i: tracked.index, key: tracked.key });
      }
    }

    // Determine what the next state is going to be, reusing components when possible.
    const newState = [];

    for (let i = 0; i < list.length; i++) {
      const key = newKeys[i];
      const isAdded = added.some((x) => x.key === key);
      let component;

      if (isAdded) {
        component = this.createItem(list[i]);
      } else {
        component = this.state.find((x) => x.key === key).component;
      }

      newState.push({
        index: i,
        key,
        component,
      });
    }

    // Batch all changes into an animation frame
    requestAnimationFrame(() => {
      // Unmount removed components
      for (const entry of removed) {
        const item = this.state.find((x) => x.key === entry.key);

        item?.component.disconnect();
      }

      const fragment = new DocumentFragment();

      // Remount components in new order
      let previous = undefined;
      for (const item of newState) {
        item.component.connect(fragment, previous);

        if (item.component.hasOwnProperty("root")) {
          previous = item.component.element;
        }
      }

      this.element.parentNode.insertBefore(fragment, this.element.nextSibling);

      this.state = newState;
    });
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.source(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.source());
  }

  disconnected() {
    for (const item of this.state) {
      item.component.disconnect();
    }

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}

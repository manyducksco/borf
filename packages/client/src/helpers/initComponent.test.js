import { isState, makeState } from "@woofjs/state";
import { h } from "../h.js";
import { initComponent } from "./initComponent.js";
import { isComponent } from "./typeChecking.js";

/*========================*\
||         Utils          ||
\*========================*/

const appContext = {
  getService,
};

const mockServices = {
  "@app": appContext,
  "@debug": {
    makeChannel(name) {
      return {};
    },
  },
};

function getService(name) {
  return mockServices[name];
}

/**
 * Creates a mock DOM node for testing.
 */
function makeDOMNode() {
  const self = {
    isDOM: true,
    parentNode: null,
    insertBefore: jest.fn((child, sibling) => {
      const childIndex = self.children.indexOf(child);

      // Remove child if already there.
      if (childIndex > -1) {
        self.children.splice(childIndex, 1);
      }

      const siblingIndex = sibling ? node.children.indexOf(sibling) : -1;

      // Insert after sibling
      self.children.splice(siblingIndex, 0, child);

      child.parentNode = self;
    }),
    removeChild: jest.fn((child) => {
      const index = self.children.indexOf(child);

      if (index > -1) {
        self.children.splice(index, 1);
        child.parentNode = null;
      }
    }),
    children: [],
  };

  return self;
}

/*========================*\
||         Tests          ||
\*========================*/

test("returns a component", () => {
  function Component() {
    return h("p", "This is just a test.");
  }

  const result = initComponent(appContext, Component);

  expect(isComponent(result)).toBe(true);
});

test("throws if component doesn't return an element or null", () => {
  function InvalidOne() {}
  function InvalidTwo() {
    return ["what is this"];
  }
  function InvalidThree() {
    return InvalidTwo;
  }
  function Valid() {
    return null;
  }
  function AlsoValid() {
    return h("p", "This is expected.");
  }

  expect(() => initComponent(appContext, InvalidOne)).toThrow();
  expect(() => initComponent(appContext, InvalidTwo)).toThrow();
  expect(() => initComponent(appContext, InvalidThree)).toThrow();

  expect(() => initComponent(appContext, Valid)).not.toThrow();
  expect(() => initComponent(appContext, AlsoValid)).not.toThrow();
});

test("connect, disconnect and lifecycle hooks", () => {
  const parent = makeDOMNode();
  const after = makeDOMNode();
  parent.insertBefore(after, null);

  // Two hooks for each lifecycle event to make sure multiples are supported.
  let beforeConnect = jest.fn();
  let beforeConnect2 = jest.fn();
  let afterConnect = jest.fn();
  let afterConnect2 = jest.fn();
  let beforeDisconnect = jest.fn();
  let beforeDisconnect2 = jest.fn();
  let afterDisconnect = jest.fn();
  let afterDisconnect2 = jest.fn();

  function Component($attrs, self) {
    // 1 functions are using this.*
    this.beforeConnect(beforeConnect);
    this.afterConnect(afterConnect);
    this.beforeDisconnect(beforeDisconnect);
    this.afterDisconnect(afterDisconnect);

    // 2 functions are using self.* (same object)
    self.beforeConnect(beforeConnect2);
    self.afterConnect(afterConnect2);
    self.beforeDisconnect(beforeDisconnect2);
    self.afterDisconnect(afterDisconnect2);

    return makeDOMNode();
    // return h("p", "This is just a test.");
  }

  const result = initComponent(appContext, Component);

  expect(parent.children.length).toBe(1);
  expect(result.isConnected).toBe(false);
  expect(beforeConnect).toHaveBeenCalledTimes(0);
  expect(beforeConnect2).toHaveBeenCalledTimes(0);
  expect(afterConnect).toHaveBeenCalledTimes(0);
  expect(afterConnect2).toHaveBeenCalledTimes(0);
  expect(beforeDisconnect).toHaveBeenCalledTimes(0);
  expect(beforeDisconnect2).toHaveBeenCalledTimes(0);
  expect(afterDisconnect).toHaveBeenCalledTimes(0);
  expect(afterDisconnect2).toHaveBeenCalledTimes(0);

  result.connect(parent, after);

  expect(parent.insertBefore).toHaveBeenCalled();
  expect(parent.children.length).toBe(2);
  expect(result.isConnected).toBe(true);
  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(beforeConnect2).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect2).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect).toHaveBeenCalledTimes(0);
  expect(beforeDisconnect2).toHaveBeenCalledTimes(0);
  expect(afterDisconnect).toHaveBeenCalledTimes(0);
  expect(afterDisconnect2).toHaveBeenCalledTimes(0);

  // Connect again to confirm that lifecycle hooks aren't called again.
  result.connect(parent, after);

  expect(parent.insertBefore).toHaveBeenCalled();
  expect(parent.children.length).toBe(2);
  expect(result.isConnected).toBe(true);
  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(beforeConnect2).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect2).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect).toHaveBeenCalledTimes(0);
  expect(beforeDisconnect2).toHaveBeenCalledTimes(0);
  expect(afterDisconnect).toHaveBeenCalledTimes(0);
  expect(afterDisconnect2).toHaveBeenCalledTimes(0);

  result.disconnect();

  expect(parent.removeChild).toHaveBeenCalled();
  expect(parent.children.length).toBe(1);
  expect(result.isConnected).toBe(false);
  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(beforeConnect2).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect2).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect2).toHaveBeenCalledTimes(1);
  expect(afterDisconnect).toHaveBeenCalledTimes(1);
  expect(afterDisconnect2).toHaveBeenCalledTimes(1);
});

test(".node returns the root DOM node", () => {
  const root = makeDOMNode();

  function NullComponent() {
    return null;
  }

  function DOMComponent() {
    return root;
  }

  function NestedComponent() {
    return h(DOMComponent);
  }

  function ChildrenComponent() {
    return this.children;
  }

  const nullResult = initComponent(appContext, NullComponent);
  const domResult = initComponent(appContext, DOMComponent);
  const nestedResult = initComponent(appContext, NestedComponent);
  const childrenResult = initComponent(appContext, ChildrenComponent, null, root);

  expect(nullResult.node).toBe(null);
  expect(domResult.node).toBe(root);
  expect(nestedResult.node).toBe(root);
  expect(childrenResult.node).toBe(root);
});

test("attributes have correct initial values", () => {
  const initialized = jest.fn();

  function Component($attrs, self) {
    const attrs = $attrs.get();

    expect(isState(attrs.$stateAsState)).toBe(true);
    expect(attrs.$stateAsState.get()).toBe(5);

    expect(isState(attrs.stateAsValue)).toBe(false);
    expect(attrs.stateAsValue).toBe("yo");

    expect(attrs.normalAttr).toStrictEqual({ cool: "yeah" });

    expect(() => {
      $attrs.set({ nope: "you can't do this." });
    }).toThrow();

    // Call mock function to prove this ran.
    initialized();

    return null;
  }

  const $stateAsState = makeState(5);
  const $stateAsValue = makeState("yo");
  const normalAttr = { cool: "yeah" };

  initComponent(appContext, Component, {
    $stateAsState,
    stateAsValue: $stateAsValue,
    normalAttr,
  });

  expect(initialized).toHaveBeenCalledTimes(1);
});

test("two-way state attributes can be changed from inside the component", () => {
  function Component($attrs, self) {
    const { $twoWay } = $attrs.get();

    $twoWay.set(2);

    return null;
  }

  const $twoWay = makeState(1);

  initComponent(appContext, Component, { $twoWay });

  expect($twoWay.get()).toBe(2);
});

test("state attributes mapped in the component update when the state changes while connected", () => {
  const twoWayChanged = jest.fn();
  const oneWayChanged = jest.fn();
  const immediateChanged = jest.fn();
  const addedLateChanged = jest.fn();

  function Component($attrs, self) {
    const $twoWay = $attrs.get("$twoWay");
    const $oneWay = $attrs.map("oneWay");

    self.watchState($twoWay, twoWayChanged);
    self.watchState($oneWay, oneWayChanged);

    self.watchState($oneWay, immediateChanged, { immediate: true });

    return null;
  }

  const $twoWay = makeState(1);
  const $oneWay = makeState("hello");

  const result = initComponent(appContext, Component, {
    $twoWay,
    oneWay: $oneWay,
  });
  const parent = makeDOMNode();

  // Not connected yet. No calls expected.

  $twoWay.set(2);
  $oneWay.set("there");

  expect(twoWayChanged).toHaveBeenCalledTimes(0);
  expect(oneWayChanged).toHaveBeenCalledTimes(0);
  expect(immediateChanged).toHaveBeenCalledTimes(0);

  result.connect(parent);

  // Now connected. State watchers should be receiving changes. Immediate watcher should have also received the current value when connected.

  $twoWay.set(3);
  $oneWay.set("world");

  expect(twoWayChanged).toHaveBeenCalledTimes(1);
  expect(oneWayChanged).toHaveBeenCalledTimes(1);
  expect(immediateChanged).toHaveBeenCalledTimes(2);

  expect(twoWayChanged).toHaveBeenCalledWith(3);
  expect(oneWayChanged).toHaveBeenCalledWith("world");
  expect(immediateChanged).toHaveBeenCalledWith("there");
  expect(immediateChanged).toHaveBeenCalledWith("world");

  result.disconnect();

  // Disconnected again. No changes.

  $twoWay.set(4);
  $oneWay.set("!");

  expect(twoWayChanged).toHaveBeenCalledTimes(1);
  expect(oneWayChanged).toHaveBeenCalledTimes(1);
  expect(immediateChanged).toHaveBeenCalledTimes(2);
});

test("throws when setting a two way attr that isn't a state", () => {
  function Component() {}

  expect(() => {
    initComponent(appContext, Component, { $state: "not state" });
  }).toThrow();
});

test("self.isConnected reflects the current state", () => {
  const hookCalled = jest.fn();

  function Component($attrs, self) {
    self.beforeConnect(() => {
      hookCalled();
      expect(self.isConnected).toBe(false);
    });

    self.afterConnect(() => {
      hookCalled();
      expect(self.isConnected).toBe(true);
    });

    self.beforeDisconnect(() => {
      hookCalled();
      expect(self.isConnected).toBe(true);
    });

    self.afterDisconnect(() => {
      hookCalled();
      expect(self.isConnected).toBe(false);
    });

    return null;
  }

  const result = initComponent(appContext, Component);
  const parent = makeDOMNode();

  result.connect(parent);
  result.disconnect();

  expect(hookCalled).toBeCalledTimes(4);
});

test("supports returning subcomponents", () => {
  const subNode = makeDOMNode();

  function Subcomponent() {
    return subNode;
  }

  function Component() {
    return h(Subcomponent);
  }

  const result = initComponent(appContext, Component);
  const parent = makeDOMNode();

  result.connect(parent);

  expect(parent.children.length).toBe(1);
  expect(parent.children[0]).toBe(subNode);

  result.disconnect();

  expect(parent.children.length).toBe(0);
});

test("throws error when calling self.watchState when component is already connected", () => {
  function Component($attrs, self) {
    const $nothing = $attrs.map("nonexistent");

    self.afterConnect(() => {
      self.watchState($nothing, (value) => {
        console.log("This won't run.");
      });
    });

    return null;
  }

  const result = initComponent(appContext, Component);
  const parent = makeDOMNode();

  expect(() => {
    result.connect(parent);
  }).toThrow();
});

test("routePreload takes element to show() and resolves when done() is called", async () => {
  const loader = h("div", h("h1", "Loading..."));
  const mount = jest.fn();

  function Component($attrs, self) {
    self.loadRoute(({ show, done }) => {
      show(loader);

      setTimeout(done, 100);
    });

    return null;
  }

  const result = initComponent(appContext, Component);

  expect(result.hasRoutePreload).toBe(true);

  const start = Date.now();
  await result.routePreload(mount);
  const waitTime = Date.now() - start;

  expect(mount).toHaveBeenCalledTimes(1);
  expect(waitTime >= 100).toBe(true);
});

test("routePreload show() throws if value isn't an element", async () => {
  const mount = jest.fn();

  function Component($attrs, self) {
    self.loadRoute(({ show, done }) => {
      show("potato");
      done();
    });

    return null;
  }

  const result = initComponent(appContext, Component);

  expect(result.hasRoutePreload).toBe(true);

  let error = null;

  try {
    await result.routePreload(mount);
  } catch (err) {
    error = err;
  }

  expect(error).not.toBe(null);
});

test("routePreload finishes with promise resolution if loadRoute returns one", async () => {
  const mount = jest.fn();

  function Component($attrs, self) {
    self.loadRoute(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    return null;
  }

  const result = initComponent(appContext, Component);

  expect(result.hasRoutePreload).toBe(true);

  const start = Date.now();
  await result.routePreload(mount);
  const waitTime = Date.now() - start;

  expect(mount).toHaveBeenCalledTimes(0); // show() was not called
  expect(waitTime >= 100).toBe(true);
});

test("routePreload resolves immediately if no loadRoute callback is defined", async () => {
  const mount = jest.fn();

  function Component() {
    return null;
  }

  const result = initComponent(appContext, Component);

  expect(result.hasRoutePreload).toBe(false);
  expect(result.routePreload(mount)).resolves.not.toThrow();
});
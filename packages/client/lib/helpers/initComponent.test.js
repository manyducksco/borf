import { h } from "../h.js";
import { makeState } from "../state/makeState.js";
import { initComponent } from "./initComponent.js";
import { isComponent, isState } from "./typeChecking.js";

/*========================*\
||         Utils          ||
\*========================*/

const appContext = {
  services: {
    app: null,
  },
  debug: {
    makeChannel(name) {
      return {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      };
    },
  },
};

appContext.services.app = appContext;

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

  const result = initComponent(Component, { appContext });

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

  expect(() => initComponent(InvalidOne, { appContext })).toThrow();
  expect(() => initComponent(InvalidTwo, { appContext })).toThrow();
  expect(() => initComponent(InvalidThree, { appContext })).toThrow();

  expect(() => initComponent(Valid, { appContext })).not.toThrow();
  expect(() => initComponent(AlsoValid, { appContext })).not.toThrow();
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

  function Component(ctx) {
    // 1 functions are using this.*
    this.beforeConnect(beforeConnect);
    this.afterConnect(afterConnect);
    this.beforeDisconnect(beforeDisconnect);
    this.afterDisconnect(afterDisconnect);

    // 2 functions are using ctx.* (same object)
    ctx.beforeConnect(beforeConnect2);
    ctx.afterConnect(afterConnect2);
    ctx.beforeDisconnect(beforeDisconnect2);
    ctx.afterDisconnect(afterDisconnect2);

    return makeDOMNode();
    // return h("p", "This is just a test.");
  }

  const result = initComponent(Component, { appContext });

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

  const nullResult = initComponent(NullComponent, { appContext });
  const domResult = initComponent(DOMComponent, { appContext });
  const nestedResult = initComponent(NestedComponent, { appContext });
  const childrenResult = initComponent(ChildrenComponent, { appContext, children: root });

  expect(nullResult.node).toBe(null);
  expect(domResult.node).toBe(root);
  expect(nestedResult.node).toBe(root);
  expect(childrenResult.node).toBe(root);
});

test("attributes have correct initial values", () => {
  const initialized = jest.fn();

  function Component(ctx) {
    const attrs = ctx.$attrs.get();

    expect(isState(attrs.$stateAsState)).toBe(true);
    expect(attrs.$stateAsState.get()).toBe(5);

    expect(isState(attrs.stateAsValue)).toBe(false);
    expect(attrs.stateAsValue).toBe("yo");

    expect(attrs.normalAttr).toStrictEqual({ cool: "yeah" });

    expect(() => {
      ctx.$attrs.set({ nope: "you can't do this." });
    }).toThrow();

    // Call mock function to prove this ran.
    initialized();

    return null;
  }

  const $stateAsState = makeState(5);
  const $stateAsValue = makeState("yo");
  const normalAttr = { cool: "yeah" };

  initComponent(Component, {
    attrs: {
      $stateAsState,
      stateAsValue: $stateAsValue,
      normalAttr,
    },
    appContext,
  });

  expect(initialized).toHaveBeenCalledTimes(1);
});

test("two-way state attributes can be changed from inside the component", () => {
  function Component(ctx) {
    const { $twoWay } = ctx.$attrs.get();

    $twoWay.set(2);

    return null;
  }

  const $twoWay = makeState(1);

  initComponent(Component, { attrs: { $twoWay }, appContext });

  expect($twoWay.get()).toBe(2);
});

test("state attributes mapped in the component update when the state changes while connected", () => {
  const twoWayChanged = jest.fn();
  const oneWayChanged = jest.fn();

  function Component(ctx) {
    const $twoWay = ctx.$attrs.get((a) => a.$twoWay);
    const $oneWay = ctx.$attrs.map((a) => a.oneWay);

    ctx.subscribeTo($twoWay, twoWayChanged);
    ctx.subscribeTo($oneWay, oneWayChanged);

    return null;
  }

  const $twoWay = makeState(1);
  const $oneWay = makeState("hello");

  const result = initComponent(Component, {
    attrs: {
      $twoWay,
      oneWay: $oneWay,
    },
    appContext,
  });
  const parent = makeDOMNode();

  // Not connected yet. No calls expected.

  $twoWay.set(2);
  $oneWay.set("there");

  expect(twoWayChanged).toHaveBeenCalledTimes(0);
  expect(oneWayChanged).toHaveBeenCalledTimes(0);

  result.connect(parent);

  // Now connected. State watchers should have received initial values.

  expect(twoWayChanged).toHaveBeenCalledTimes(1);
  expect(oneWayChanged).toHaveBeenCalledTimes(1);

  $twoWay.set(3);
  $oneWay.set("world");

  expect(twoWayChanged).toHaveBeenCalledTimes(2);
  expect(oneWayChanged).toHaveBeenCalledTimes(2);

  expect(twoWayChanged).toHaveBeenCalledWith(3);
  expect(oneWayChanged).toHaveBeenCalledWith("world");

  result.disconnect();

  // Disconnected again. No changes.

  $twoWay.set(4);
  $oneWay.set("!");

  expect(twoWayChanged).toHaveBeenCalledTimes(2);
  expect(oneWayChanged).toHaveBeenCalledTimes(2);
});

test("throws when setting a two way attr that isn't a state", () => {
  function Component() {}

  expect(() => {
    initComponent(Component, { attrs: { $state: "not state" }, appContext });
  }).toThrow();
});

test("self.isConnected reflects the current state", () => {
  const hookCalled = jest.fn();

  function Component(ctx) {
    ctx.beforeConnect(() => {
      hookCalled();
      expect(ctx.isConnected).toBe(false);
    });

    ctx.afterConnect(() => {
      hookCalled();
      expect(ctx.isConnected).toBe(true);
    });

    ctx.beforeDisconnect(() => {
      hookCalled();
      expect(ctx.isConnected).toBe(true);
    });

    ctx.afterDisconnect(() => {
      hookCalled();
      expect(ctx.isConnected).toBe(false);
    });

    return null;
  }

  const result = initComponent(Component, { appContext });
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

  const result = initComponent(Component, { appContext });
  const parent = makeDOMNode();

  result.connect(parent);

  expect(parent.children.length).toBe(1);
  expect(parent.children[0]).toBe(subNode);

  result.disconnect();

  expect(parent.children.length).toBe(0);
});

test("routePreload takes element to show() and resolves when done() is called", async () => {
  const loader = h("div", h("h1", "Loading..."));
  const mount = jest.fn();

  function Component(ctx) {
    ctx.loadRoute(({ show, done }) => {
      show(loader);

      setTimeout(done, 100);
    });

    return null;
  }

  const result = initComponent(Component, { appContext });

  expect(result.hasRoutePreload).toBe(true);

  const start = Date.now();
  await result.routePreload(mount);
  const waitTime = Date.now() - start;

  expect(mount).toHaveBeenCalledTimes(1);
  expect(waitTime >= 100).toBe(true);
});

test("routePreload show() throws if value isn't an element", async () => {
  const mount = jest.fn();

  function Component(ctx) {
    ctx.loadRoute(({ show, done }) => {
      show("potato");
      done();
    });

    return null;
  }

  const result = initComponent(Component, { appContext });

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

  function Component(ctx) {
    ctx.loadRoute(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    return null;
  }

  const result = initComponent(Component, { appContext });

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

  const result = initComponent(Component, { appContext });

  expect(result.hasRoutePreload).toBe(false);
  expect(result.routePreload(mount)).resolves.not.toThrow();
});

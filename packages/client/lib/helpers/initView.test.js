import { h } from "../h.js";
import { initView } from "./initView.js";
import { isView } from "./typeChecking.js";

/*========================*\
||         Utils          ||
\*======================== */

const appContext = {
  globals: {
    debug: {
      exports: {
        channel() {
          return {
            log: () => {},
            warn: () => {},
            error: () => {},
          };
        },
      },
    },
  },
  debug: {
    makeChannel() {
      return {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      };
    },
  },
};

appContext.globals.app = appContext;

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

      const siblingIndex = sibling ? self.children.indexOf(sibling) : -1;

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

/* ========================*\
||         Tests          ||
\*======================== */

test("returns a window", () => {
  function Component() {
    return h("p", "This is just a test.");
  }

  const result = initView(Component, { appContext });

  expect(isView(result)).toBe(true);
});

test("throws if window doesn't return an element or null", () => {
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

  expect(() => initView(InvalidOne, { appContext })).toThrow();
  expect(() => initView(InvalidTwo, { appContext })).toThrow();
  expect(() => initView(InvalidThree, { appContext })).toThrow();

  expect(() => initView(Valid, { appContext })).not.toThrow();
  expect(() => initView(AlsoValid, { appContext })).not.toThrow();
});

test("connect, disconnect and lifecycle hooks", () => {
  const parent = makeDOMNode();
  const after = makeDOMNode();
  parent.insertBefore(after, null);

  // Two hooks for each lifecycle event to make sure multiples are supported.
  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();
  const beforeDisconnect = jest.fn();
  const afterDisconnect = jest.fn();

  function View(ctx) {
    ctx.beforeConnect(beforeConnect);
    ctx.afterConnect(afterConnect);
    ctx.beforeDisconnect(beforeDisconnect);
    ctx.afterDisconnect(afterDisconnect);

    return makeDOMNode();
    // return h("p", "This is just a test.");
  }

  const result = initView(View, { appContext });

  expect(parent.children.length).toBe(1);
  expect(result.isConnected).toBe(false);
  expect(beforeConnect).toHaveBeenCalledTimes(0);
  expect(afterConnect).toHaveBeenCalledTimes(0);
  expect(beforeDisconnect).toHaveBeenCalledTimes(0);
  expect(afterDisconnect).toHaveBeenCalledTimes(0);

  result.connect(parent, after);

  expect(parent.insertBefore).toHaveBeenCalled();
  expect(parent.children.length).toBe(2);
  expect(result.isConnected).toBe(true);
  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect).toHaveBeenCalledTimes(0);
  expect(afterDisconnect).toHaveBeenCalledTimes(0);

  // Connect again to confirm that lifecycle hooks aren't called again.
  result.connect(parent, after);

  expect(parent.insertBefore).toHaveBeenCalled();
  expect(parent.children.length).toBe(2);
  expect(result.isConnected).toBe(true);
  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect).toHaveBeenCalledTimes(0);
  expect(afterDisconnect).toHaveBeenCalledTimes(0);

  result.disconnect();

  expect(parent.removeChild).toHaveBeenCalled();
  expect(parent.children.length).toBe(1);
  expect(result.isConnected).toBe(false);
  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(beforeDisconnect).toHaveBeenCalledTimes(1);
  expect(afterDisconnect).toHaveBeenCalledTimes(1);
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

  function ChildrenComponent(ctx) {
    return ctx.outlet();
  }

  const nullResult = initView(NullComponent, { appContext });
  const domResult = initView(DOMComponent, { appContext });
  const nestedResult = initView(NestedComponent, { appContext });
  const childrenResult = initView(ChildrenComponent, { appContext, children: root });

  expect(nullResult.node).toBe(null);
  expect(domResult.node).toBe(root);
  expect(nestedResult.node).toBe(root);
  expect(childrenResult.node).toBe(root);
});

// test("attributes have correct initial values", () => {
//   const initialized = jest.fn();

//   function Component() {
//     const attrs = this.$attrs.get();

//     expect(isState(attrs.$stateAsState)).toBe(true);
//     expect(attrs.$stateAsState.get()).toBe(5);

//     expect(isState(attrs.stateAsValue)).toBe(false);
//     expect(attrs.stateAsValue).toBe("yo");

//     expect(attrs.normalAttr).toStrictEqual({ cool: "yeah" });

//     expect(() => {
//       this.$attrs.set({ nope: "you can't do this." });
//     }).toThrow();

//     // Call mock function to prove this ran.
//     initialized();

//     return null;
//   }

//   const $stateAsState = makeState(5);
//   const $stateAsValue = makeState("yo");
//   const normalAttr = { cool: "yeah" };

//   makeView(Component, {
//     attrs: {
//       $stateAsState,
//       stateAsValue: $stateAsValue,
//       normalAttr,
//     },
//     appContext,
//   });

//   expect(initialized).toHaveBeenCalledTimes(1);
// });

// test("two-way state attributes can be changed from inside the component", () => {
//   function Component() {
//     const { $twoWay } = this.$attrs.get();

//     $twoWay.set(2);

//     return null;
//   }

//   const $twoWay = makeState(1);

//   makeView(Component, { attrs: { $twoWay }, appContext });

//   expect($twoWay.get()).toBe(2);
// });

// test("state attributes mapped in the component update when the state changes while connected", () => {
//   const twoWayChanged = jest.fn();
//   const oneWayChanged = jest.fn();

//   function Component() {
//     const $twoWay = this.$attrs.get((a) => a.$twoWay);
//     const $oneWay = this.$attrs.map((a) => a.oneWay);

//     this.subscribeTo($twoWay, twoWayChanged);
//     this.subscribeTo($oneWay, oneWayChanged);

//     return null;
//   }

//   const $twoWay = makeState(1);
//   const $oneWay = makeState("hello");

//   const result = makeView(Component, {
//     attrs: {
//       $twoWay,
//       oneWay: $oneWay,
//     },
//     appContext,
//   });
//   const parent = makeDOMNode();

//   // Not connected yet. No calls expected.

//   $twoWay.set(2);
//   $oneWay.set("there");

//   expect(twoWayChanged).toHaveBeenCalledTimes(0);
//   expect(oneWayChanged).toHaveBeenCalledTimes(0);

//   result.connect(parent);

//   // Now connected. State watchers should have received initial values.

//   expect(twoWayChanged).toHaveBeenCalledTimes(1);
//   expect(oneWayChanged).toHaveBeenCalledTimes(1);

//   $twoWay.set(3);
//   $oneWay.set("world");

//   expect(twoWayChanged).toHaveBeenCalledTimes(2);
//   expect(oneWayChanged).toHaveBeenCalledTimes(2);

//   expect(twoWayChanged).toHaveBeenCalledWith(3);
//   expect(oneWayChanged).toHaveBeenCalledWith("world");

//   result.disconnect();

//   // Disconnected again. No changes.

//   $twoWay.set(4);
//   $oneWay.set("!");

//   expect(twoWayChanged).toHaveBeenCalledTimes(2);
//   expect(oneWayChanged).toHaveBeenCalledTimes(2);
// });

test("throws when setting a two way attr that isn't a state", () => {
  function Component() {}

  expect(() => {
    initView(Component, { attrs: { $state: "not state" }, appContext });
  }).toThrow();
});

test("ctx.isConnected reflects the current state", () => {
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

  const result = initView(Component, { appContext });
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

  const result = initView(Component, { appContext });
  const parent = makeDOMNode();

  result.connect(parent);

  expect(parent.children.length).toBe(1);
  expect(parent.children[0]).toBe(subNode);

  result.disconnect();

  expect(parent.children.length).toBe(0);
});

// test("routePreload show() throws if value isn't an element", async () => {
//   const mount = jest.fn();
//
//   function Component(ctx) {
//     ctx.loadRoute(({ show, done }) => {
//       show("potato");
//       done();
//     });
//
//     return null;
//   }
//
//   const result = initView(Component, { appContext });
//
//   expect(result.hasRoutePreload).toBe(true);
//
//   let error = null;
//
//   try {
//     await result.routePreload(mount);
//   } catch (err) {
//     error = err;
//   }
//
//   expect(error).not.toBe(null);
// });
//
// test("routePreload finishes with promise resolution if loadRoute returns one", async () => {
//   const mount = jest.fn();
//
//   function Component() {
//     this.loadRoute(() => {
//       return new Promise((resolve) => {
//         setTimeout(resolve, 100);
//       });
//     });
//
//     return null;
//   }
//
//   const result = initView(Component, { appContext });
//
//   expect(result.hasRoutePreload).toBe(true);
//
//   const start = Date.now();
//   await result.routePreload(mount);
//   const waitTime = Date.now() - start;
//
//   expect(mount).toHaveBeenCalledTimes(0); // show() was not called
//   expect(waitTime >= 100).toBe(true);
// });
//
// test("routePreload resolves immediately if no loadRoute callback is defined", async () => {
//   const mount = jest.fn();
//
//   function Component() {
//     return null;
//   }
//
//   const result = initView(Component, { appContext });
//
//   expect(result.hasRoutePreload).toBe(false);
//   expect(result.routePreload(mount)).resolves.not.toThrow();
// });

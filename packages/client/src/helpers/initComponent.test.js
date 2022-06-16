import { h } from "../h.js";
import { initComponent } from "./initComponent.js";
import { isComponent } from "./typeChecking.js";

const mockServices = {
  "@app": {
    getService,
  },
  "@debug": {
    makeChannel(name) {
      return {};
    },
  },
};

function getService(name) {
  return mockServices[name];
}

test("result is component", () => {
  function Component() {
    return h("p", "This is just a test.");
  }

  const result = initComponent(getService("@app"), Component);

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

  const app = getService("@app");

  expect(() => initComponent(app, InvalidOne)).toThrow();
  expect(() => initComponent(app, InvalidTwo)).toThrow();
  expect(() => initComponent(app, InvalidThree)).toThrow();

  expect(() => initComponent(app, Valid)).not.toThrow();
  expect(() => initComponent(app, AlsoValid)).not.toThrow();
});

test.skip("connect/disconnect", () => {
  // Also: isConnected is true after .connect() and false after .disconnect()
});

test.skip("lifecycle hooks", () => {
  // beforeConnect
  // afterConnect
  // beforeDisconnect
  // afterDisconnect
  // Also: supports multiples of each hook
  // Also: doesn't call lifecycle hooks again if .connect() is called while already connected
});

test.skip("attributes", () => {
  // all attributes are present and expected values when component function is called
  // states passed as states (two way data binding)
  //  - can modify state in component and see new value in parent
  // states passed as regular attributes (one way data binding)
  //  - value updates when passed state is updated
  // can't $attrs.set() in the component function
});

test.skip("watchState", () => {
  // starts receiving changes when component is connected
  // stops receiving changes when component is disconnected
});

// Also: supports this.* in non-arrow function and self.* parameter in any function
// Also: routePreload

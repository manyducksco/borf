import { initService } from "./initService.js";

/*========================*\
||         Utils          ||
\*========================*/

const appContext = {
  makeGetService() {
    return getService;
  },
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

const debug = {};

/*========================*\
||         Tests          ||
\*========================*/

test("lifecycle hooks", () => {
  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();
  const beforeConnect2 = jest.fn();
  const afterConnect2 = jest.fn();

  function Service(self) {
    // Testing both this.* and self.* (same object)
    this.beforeConnect(beforeConnect);
    this.afterConnect(afterConnect);

    self.beforeConnect(beforeConnect2);
    self.afterConnect(afterConnect2);

    return { works: true };
  }

  const result = initService(appContext, Service, debug, { name: "test" });

  expect(result.exports).toStrictEqual({ works: true });

  expect(beforeConnect).toHaveBeenCalledTimes(0);
  expect(afterConnect).toHaveBeenCalledTimes(0);
  expect(beforeConnect2).toHaveBeenCalledTimes(0);
  expect(afterConnect2).toHaveBeenCalledTimes(0);

  result.beforeConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(0);
  expect(beforeConnect2).toHaveBeenCalledTimes(1);
  expect(afterConnect2).toHaveBeenCalledTimes(0);

  result.afterConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
  expect(beforeConnect2).toHaveBeenCalledTimes(1);
  expect(afterConnect2).toHaveBeenCalledTimes(1);
});

test("throws if fn doesn't return an object", () => {
  function NullService() {
    return null;
  }

  function StringService() {
    return "nope";
  }

  function FunctionService() {
    return function () {
      return {};
    };
  }

  function RegularService() {
    return { thisIsNormal: true };
  }

  expect(() => initService(appContext, NullService, debug, { name: "test" })).toThrow();
  expect(() => initService(appContext, StringService, debug, { name: "test" })).toThrow();
  expect(() => initService(appContext, FunctionService, debug, { name: "test" })).toThrow();

  expect(() => initService(appContext, RegularService, debug, { name: "test" })).not.toThrow();
});

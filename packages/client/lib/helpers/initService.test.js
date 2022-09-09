import { initService } from "./initService.js";

/*========================*\
||         Utils          ||
\*========================*/

const appContext = {
  services: {},
  debug: {
    makeChannel(name) {
      return {};
    },
  },
};

/*========================*\
||         Tests          ||
\*========================*/

test("lifecycle hooks", () => {
  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();

  const service = function () {
    this.beforeConnect(beforeConnect);
    this.afterConnect(afterConnect);

    return { works: true };
  };

  const svc = initService(service, { appContext, name: "test" });

  expect(svc.exports).toStrictEqual({ works: true });
  expect(typeof svc.beforeConnect).toBe("function");
  expect(typeof svc.afterConnect).toBe("function");

  expect(beforeConnect).toHaveBeenCalledTimes(0);
  expect(afterConnect).toHaveBeenCalledTimes(0);

  svc.beforeConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(0);

  svc.afterConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
});

test("throws if bootstrap doesn't return an object", () => {
  const nullService = function () {
    return null;
  };

  const stringService = function () {
    return "nope";
  };

  const functionService = function () {
    return function () {
      return {};
    };
  };

  const regularService = function () {
    return { thisIsNormal: true };
  };

  expect(() => initService(nullService, { appContext, name: "test" })).toThrow();
  expect(() => initService(stringService, { appContext, name: "test" })).toThrow();
  expect(() => initService(functionService, { appContext, name: "test" })).toThrow();

  expect(() => initService(regularService, { appContext, name: "test" })).not.toThrow();
});

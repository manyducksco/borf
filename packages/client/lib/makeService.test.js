import { makeService } from "./makeService.js";

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
  const beforeConnect2 = jest.fn();
  const afterConnect2 = jest.fn();

  const service = makeService(function (ctx) {
    // Testing both this.* and self.* (same object)
    this.beforeConnect(beforeConnect);
    this.afterConnect(afterConnect);

    ctx.beforeConnect(beforeConnect2);
    ctx.afterConnect(afterConnect2);

    return { works: true };
  });

  const result = service.init({ appContext, name: "test" });

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

test("throws if bootstrap doesn't return an object", () => {
  const nullService = makeService(() => {
    return null;
  });

  const stringService = makeService(() => {
    return "nope";
  });

  const functionService = makeService(() => {
    return function () {
      return {};
    };
  });

  const regularService = makeService(() => {
    return { thisIsNormal: true };
  });

  expect(() => nullService.init({ appContext, name: "test" })).toThrow();
  expect(() => stringService.init({ appContext, name: "test" })).toThrow();
  expect(() => functionService.init({ appContext, name: "test" })).toThrow();

  expect(() => regularService.init({ appContext, name: "test" })).not.toThrow();
});

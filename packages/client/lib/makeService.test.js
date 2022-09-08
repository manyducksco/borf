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

  const service = makeService((ctx) => {
    ctx.beforeConnect(beforeConnect);
    ctx.afterConnect(afterConnect);

    return { works: true };
  });

  const exports = service.init({ appContext, name: "test" });

  expect(exports).toStrictEqual({ works: true });

  expect(beforeConnect).toHaveBeenCalledTimes(0);
  expect(afterConnect).toHaveBeenCalledTimes(0);

  service.beforeConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(0);

  service.afterConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
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

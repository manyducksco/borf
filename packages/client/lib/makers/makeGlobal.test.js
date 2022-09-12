import { makeGlobal } from "./makeGlobal.js";

/*========================*\
||         Utils          ||
\*======================== */

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
\*======================== */

test("lifecycle hooks", () => {
  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();

  const fn = function () {
    this.beforeConnect(beforeConnect);
    this.afterConnect(afterConnect);

    return { works: true };
  };

  const instance = makeGlobal(fn, { appContext, name: "test" });

  expect(instance.exports).toStrictEqual({ works: true });
  expect(typeof instance.beforeConnect).toBe("function");
  expect(typeof instance.afterConnect).toBe("function");

  expect(beforeConnect).toHaveBeenCalledTimes(0);
  expect(afterConnect).toHaveBeenCalledTimes(0);

  instance.beforeConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(0);

  instance.afterConnect();

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
});

test("throws if bootstrap doesn't return an object", () => {
  const nullFn = function () {
    return null;
  };

  const stringFn = function () {
    return "nope";
  };

  const fnFn = function () {
    return function () {
      return {};
    };
  };

  const regularFn = function () {
    return { thisIsNormal: true };
  };

  expect(() => makeGlobal(nullFn, { appContext, name: "test" })).toThrow();
  expect(() => makeGlobal(stringFn, { appContext, name: "test" })).toThrow();
  expect(() => makeGlobal(fnFn, { appContext, name: "test" })).toThrow();

  expect(() => makeGlobal(regularFn, { appContext, name: "test" })).not.toThrow();
});

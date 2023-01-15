import { initGlobal } from "./initGlobal.js";

/*========================*\
||         Utils          ||
\*========================*/

const appContext = {
  globals: {},
  debug: {
    makeChannel(name) {
      return {};
    },
  },
};

/*========================*\
||         Tests          ||
\*========================*/

test("returns an object with the global's exports", async () => {
  function Global(self) {
    return { works: true };
  }

  const result = await initGlobal(Global, { appContext, name: "test" });

  expect(result.exports).toStrictEqual({ works: true });
});

test("handles async globals", async () => {
  async function Global(self) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ works: true });
      }, 50);
    });
  }

  const result = await initGlobal(Global, {
    appContext,
    name: "test",
  });

  expect(result.exports).toStrictEqual({ works: true });
});

test("rejects if fn doesn't return an object", () => {
  function NullGlobal() {
    return null;
  }

  function StringGlobal() {
    return "nope";
  }

  function FunctionGlobal() {
    return function () {
      return {};
    };
  }

  expect(() => initGlobal(NullGlobal, { appContext, name: "test" })).rejects.toThrow();
  expect(() => initGlobal(StringGlobal, { appContext, name: "test" })).rejects.toThrow();
  expect(() => initGlobal(FunctionGlobal, { appContext, name: "test" })).rejects.toThrow();
});

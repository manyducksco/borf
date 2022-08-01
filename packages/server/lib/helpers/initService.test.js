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

test("returns an object with the service's exports", async () => {
  function Service(self) {
    return { works: true };
  }

  const result = await initService(appContext, Service, debug, { name: "test" });

  expect(result.exports).toStrictEqual({ works: true });
});

test("handles async services", async () => {
  async function Service(self) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ works: self.options.shouldWork });
      }, 50);
    });
  }

  const result = await initService(appContext, Service, debug, {
    name: "test",
    options: { shouldWork: true },
  });

  expect(result.exports).toStrictEqual({ works: true });
});

test("rejects if fn doesn't return an object", () => {
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

  expect(() => initService(appContext, NullService, debug, { name: "test" })).rejects.toThrow();
  expect(() => initService(appContext, StringService, debug, { name: "test" })).rejects.toThrow();
  expect(() => initService(appContext, FunctionService, debug, { name: "test" })).rejects.toThrow();
});

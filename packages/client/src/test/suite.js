import { deepEqual } from "../_helpers/deepEqual";
import { makeState } from "@woofjs/state";
import { makeDolla } from "../main/dolla/Dolla";
import { makeTestWrapper } from "./makeTestWrapper";

/**
 * Defines a test suite.
 */
export function suite(fn) {
  const tests = [];
  const views = [];

  const beforeAll = [];
  const afterAll = [];
  const beforeEach = [];
  const afterEach = [];

  const test = (name, fn) => {
    tests.push({ name, fn });
  };

  test.beforeAll = (fn) => {
    beforeAll.push(fn);
  };
  test.afterAll = (fn) => {
    afterAll.push(fn);
  };
  test.beforeEach = (fn) => {
    beforeEach.push(fn);
  };
  test.afterEach = (fn) => {
    afterEach.push(fn);
  };

  const view = (name, fn) => {
    views.push({ name, fn });
  };

  fn(test, view);

  return {
    tests,
    views,

    async run(options = {}) {
      const results = [];

      await Promise.all(beforeAll.map((fn) => fn()));

      for (const test of tests) {
        await Promise.all(beforeEach.map((fn) => fn()));

        const { meta, assertions } = await runTest(test.fn);

        const result = {
          name: test.name,
          pass: !assertions.some((a) => a.pass === false),
          meta,
          assertions,
        };

        results.push(result);
        if (options.onTestFinish) {
          options.onTestFinish(result);
        }

        await Promise.all(afterEach.map((fn) => fn()));
      }

      await Promise.all(afterAll.map((fn) => fn()));

      return results;
    },

    makeView(name) {
      const view = views.find((v) => v.name === name);

      if (view == null) {
        throw new Error(`No view found with name: ${name}`);
      }

      const attrs = makeState([], {
        methods: {
          push(current, config) {
            current.push(config);
          },
          setValue(current, name, value) {
            const found = current.find((attr) => attr.name === name);

            if (found) {
              found.state.set(value);
            }
          },
        },
      });

      const makeWrapped = makeTestWrapper((getService) => {
        const $ = makeDolla({
          getService,
          match: {
            route: makeState("test", { settable: false }),
            path: makeState("/test", { settable: false }),
            params: makeState({}, { settable: false }),
            query: makeState({}, { settable: false }),
            wildcard: makeState(null, { settable: false }),
          },
        });

        return view.fn($, {
          attr: (name, value, options = {}) => {
            const state = makeState(value);

            attrs.push({
              name,
              state,
              options,
            });

            return state;
          },
        });
      });

      return {
        element: makeWrapped(),
        attrs: attrs.map((x) => x),
        setAttr(name, value) {
          attrs.setValue(name, value);
        },
      };
    },
  };
}

async function runTest(testFn) {
  return new Promise(async (resolve) => {
    let planned = undefined;
    let waitTime = 2000; // 2 second default
    let isDone = false;

    let meta = []; // test config declarations
    let assertions = []; // test results

    let asyncTimeout;

    const done = () => {
      isDone = true;
      resolve({ meta, assertions });
    };

    const pushAssertion = ({ pass, label }) => {
      assertions.push({
        pass,
        label,
        timestamp: new Date(),
      });

      if (isDone) {
        assertions.push({
          pass: false,
          label: `test made assertions after t.end() was called`,
          timestamp: new Date(),
        });
      } else {
        if (asyncTimeout && assertions.length === planned) {
          clearTimeout(asyncTimeout);
          // done();
          done();
        }
      }
    };

    const context = {
      /**
       * Configure this test to expect a specific number of assertions.
       *
       * @param {*} count
       */
      plan(count) {
        planned = count;

        meta.push({
          label: `expecting ${count} ${pluralize("assertion", planned)}`,
        });
      },

      /**
       * Configure the amount of time this test will wait for async assertions.
       *
       * @param ms - Amount of millseconds to wait.
       */
      timeout(ms) {
        waitTime = ms;
      },

      /**
       * Asserts that `actual` and `expected` are the same object (`===` strict equal).
       */
      same(actual, expected, label) {
        pushAssertion({
          pass: actual === expected,
          label: label || `expected the same object, received expected ${expected} and actual ${actual}`,
        });
      },

      /**
       * Asserts that `actual` and `expected` have the same value (deep equal).
       */
      equal(actual, expected, label) {
        pushAssertion({
          pass: deepEqual(actual, expected),
          label: label || `expected values to be equal, received expected ${expected} and actual ${actual}`,
        });
      },

      truthy(value, label) {
        pushAssertion({
          pass: !!value,
          label: label || `expected a truthy value, received ${value}`,
        });
      },

      falsy(value, label) {
        pushAssertion({
          pass: !value,
          label: label || `expected a falsy value, received ${value}`,
        });
      },

      assert(value, label) {
        this.truthy(value, label);
      },

      throws(fn, ...args) {},

      // Mock function assertions
      called(mockFn, label) {
        if (mockFn instanceof Function && mockFn.mock && Array.isArray(mockFn.mock.calls)) {
          pushAssertion({
            pass: mockFn.mock.calls.length > 0,
            label: label || `function is called`,
          });
        } else {
          throw new TypeError(`Expected a mock function. Received: ${mockFn}`);
        }
      },
      calledWith(mockFn, argument, label) {
        if (mockFn instanceof Function && mockFn.mock && Array.isArray(mockFn.mock.calls)) {
          const arg = JSON.stringify(argument);
          let pass = false;

          for (const call of mockFn.mock.calls) {
            if (call.args.map((a) => JSON.stringify(a)).includes(arg)) {
              pass = true;
              break;
            }
          }

          pushAssertion({ pass, label: label || "function is called with " + argument });
        } else {
          throw new TypeError(`Expected a mock function. Received: ${mockFn}`);
        }
      },
      calledTimes(mockFn, count, label) {
        if (mockFn instanceof Function && mockFn.mock && Array.isArray(mockFn.mock.calls)) {
          pushAssertion({
            pass: mockFn.mock.calls.length === count,
            label: label || `function is called ${count} time${count === 1 ? "" : "s"}`,
          });
        } else {
          throw new TypeError(`Expected a mock function. Received: ${mockFn}`);
        }
      },

      end() {
        done();
      },

      not: {
        same(actual, expected, label) {},
        equal(actual, expected, label) {},
        truthy(actual, label) {},
        falsy(actual, label) {},
        throws(fn, ...args) {},

        called(mockFn, label) {},
        calledWith(mockFn, ...args) {},
        calledTimes(mockFn, count, label) {},
      },

      mock: {
        fn: (implementation) => {
          const mock = {
            calls: [],
          };

          function mockFn(...args) {
            let returned;

            if (implementation) {
              returned = implementation(...args);
            } else {
              returned = undefined;
            }

            mock.calls.push({
              args,
              returned,
            });

            return returned;
          }

          mockFn.mock = mock;

          return mockFn;
        },
      },
    };

    try {
      const returned = testFn(context);

      if (returned instanceof Promise) {
        await returned;
      }
    } catch (err) {
      console.error(err);
      return done();
    }

    if (planned) {
      if (assertions.length < planned) {
        meta.push({
          label: `waiting up to ${waitTime}ms for async assertions`,
        });
        asyncTimeout = setTimeout(() => {
          if (assertions.length < planned) {
            pushAssertion({
              pass: false,
              label: `test makes ${planned} ${pluralize("assertion", planned)} within ${waitTime} ms (received ${
                assertions.length
              })`,
            });
          }
          done();
        }, waitTime);
      } else if (assertions.length > planned) {
        pushAssertion({
          pass: false,
          label: `test makes ${planned} ${pluralize("assertion", planned)} (received ${assertions.length})`,
        });
        done();
      } else {
        done();
      }
    } else {
      done();
    }
  });
}

const pluralize = (word, count) => {
  if (count !== 1) {
    word += "s";
  }

  return word;
};

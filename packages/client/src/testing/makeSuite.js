import { makeState } from "@woofjs/state";
import { checks } from "./checks.js";
import { isTemplate } from "../helpers/typeChecking.js";
import { initComponent } from "../helpers/initComponent.js";
import { initService } from "../helpers/initService.js";
import { makeDebug } from "../makeDebug.js";

/**
 * Defines a test suite.
 */
export function makeSuite(fn) {
  const tests = [];
  const views = [];

  const beforeAll = [];
  const afterAll = [];
  const beforeEach = [];
  const afterEach = [];

  const helpers = {
    beforeAll: (fn) => {
      beforeAll.push(fn);
    },
    afterAll: (fn) => {
      afterAll.push(fn);
    },
    beforeEach: (fn) => {
      beforeEach.push(fn);
    },
    afterEach: (fn) => {
      afterEach.push(fn);
    },
    test: (name, fn) => {
      tests.push({ name, fn });
    },
    view: (name, fn) => {
      views.push({ name, fn });
    },
  };

  fn.call(helpers, helpers);

  return {
    tests,
    views,

    /**
     * Runs all tests in the suite and returns the results.
     */
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

      const $attrs = makeState([]);

      function setAttr(name, value) {
        $attrs.set((current) => {
          const found = current.find((attr) => attr.name === name);

          if (found) {
            found.$value.set(value);
          }
        });
      }

      let element = view.fn({
        expose: (value, options = {}) => {
          const $value = makeState(value);

          return {
            isExposed: true,
            label: options.label,
            $value,
          };
        },
      });

      const exposedAttrs = [];

      if (isTemplate(element)) {
        // Process exposed attributes.
        for (const name in element.attrs) {
          const attribute = element.attrs[name];

          if (attribute.isExposed) {
            exposedAttrs.push({
              name,
              label: attribute.label || name,
              $value: attribute.$value,
            });

            element.attrs[name] = attribute.$value;
          }
        }

        $attrs.set(exposedAttrs);

        return {
          element: element.init(getService("@app")),
          $attrs: $attrs.map(),
          updateAttr: setAttr,
        };
      } else {
        throw new Error(`View must return an element. Got: ${typeof element}`);
      }
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

    const pushAssertion = (assertion) => {
      assertions.push({
        ...assertion,
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
          label: `expecting ${count} assertion${planned == 1 ? "" : "s"}`,
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
      same(actual, expected, label = "both values are the same object") {
        pushAssertion({
          pass: checks.same(actual, expected),
          label,
          expected,
          actual,
        });
      },

      /**
       * Asserts that `actual` and `expected` have the same value (deep equal).
       */
      equal(actual, expected, label = "both values are equal") {
        pushAssertion({
          pass: checks.equal(actual, expected),
          label,
          expected,
          actual,
        });
      },

      truthy(value, label = "value is truthy") {
        pushAssertion({
          pass: checks.truthy(value),
          label,
          actual: value,
        });
      },

      falsy(value, label = "value is falsy") {
        pushAssertion({
          pass: checks.falsy(value),
          label,
          actual: value,
        });
      },

      throws(fn, label = "function throws") {
        checks.throws(fn).then((err) => {
          pushAssertion({
            pass: err != null,
            label,
            actual: err,
          });
        });
      },

      // Mock function assertions
      called(mockFn, label = "function is called") {
        pushAssertion({
          pass: checks.called(mockFn),
          label,
        });
      },

      calledWith(mockFn, argument, label) {
        pushAssertion({
          pass: checks.calledWith(mockFn, argument),
          label: label || "function is called with " + argument,
        });
      },

      calledTimes(mockFn, count, label) {
        pushAssertion({
          pass: checks.calledTimes(mockFn, count),
          label: label || `function is called ${count} time${count === 1 ? "" : "s"}`,
        });
      },

      end() {
        done();
      },

      not: {
        same(actual, expected, label = "both values are the not same object") {
          pushAssertion({
            pass: !checks.same(actual, expected),
            label,
            expected,
            actual,
          });
        },

        equal(actual, expected, label = "both values are not equal") {
          pushAssertion({
            pass: !checks.equal(actual, expected),
            label,
            expected,
            actual,
          });
        },

        truthy(value, label = "value is not truthy") {
          pushAssertion({
            pass: !checks.truthy(value),
            label,
            actual: value,
          });
        },

        falsy(value, label = "value is not falsy") {
          pushAssertion({
            pass: !checks.falsy(value),
            label,
            actual: value,
          });
        },

        throws(fn, label = "function does not throw") {
          checks.throws(fn).then((err) => {
            pushAssertion({
              pass: err == null,
              label,
              actual: err,
            });
          });
        },

        called(mockFn, label = "function is not called") {
          pushAssertion({
            pass: !checks.called(mockFn),
            label,
          });
        },

        calledWith(mockFn, argument, label) {
          pushAssertion({
            pass: !checks.calledWith(mockFn, argument),
            label: label || "function is not called with " + argument,
          });
        },

        calledTimes(mockFn, count, label) {
          pushAssertion({
            pass: !checks.calledTimes(mockFn, count),
            label: label || `function is not called ${count} time${count === 1 ? "" : "s"}`,
          });
        },
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

      /**
       * Creates a test container for a component.
       */
      component: (fn, attrs, children) => {
        const debug = makeDebug();

        const getService = fn.isWrapped
          ? fn.getService
          : (name) => {
              if (name === "@app") {
                return { getService };
              } else if (name === "@debug") {
                return debug;
              } else {
                throw new Error(
                  `Wrap this component with the required services using wrapComponent. Requested service: ${name}`
                );
              }
            };

        const result = initComponent({ getService }, fn, attrs, children);
        const parent = document.createElement("div");

        return {
          $attrs: result.$attrs,

          connect() {
            result.connect(parent);
          },
          disconnect() {
            result.disconnect();
          },
          querySelector(...args) {
            return parent.querySelector(...args);
          },
          querySelectorAll(...args) {
            return parent.querySelectorAll(...args);
          },
        };
      },

      /**
       * Creates a test container for a service.
       */
      service: (fn, options = {}) => {
        const debug = makeDebug();

        const getService = fn.isWrapped
          ? fn.getService
          : (name) => {
              if (name === "@app") {
                return { getService };
              } else if (name === "@debug") {
                return debug;
              } else {
                throw new Error(
                  `Wrap this service with the required services using wrapService. Requested service: ${name}`
                );
              }
            };

        const result = initService({ getService }, fn, debug.makeChannel("test"), options);

        return {
          exports: result.exports,

          connect() {
            result.beforeConnect();
            result.afterConnect();
          },
          disconnect() {
            console.warn(`Disconnect is not implemented for services.`);
          },
        };
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
              label: `test makes ${planned} assertion${(planned = 1 ? "" : "s")}`,
              expected: planned,
              actual: assertions.length,
            });
          }
          done();
        }, waitTime);
      } else if (assertions.length > planned) {
        pushAssertion({
          pass: false,
          label: `test makes ${planned} assertion${(planned = 1 ? "" : "s")}`,
          expected: planned,
          actual: assertions.length,
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

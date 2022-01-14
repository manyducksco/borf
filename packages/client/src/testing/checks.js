import { deepEqual } from "../helpers/deepEqual.js";

function isMockFn(value) {
  return mockFn instanceof Function && mockFn.mock && Array.isArray(mockFn.mock.calls);
}

export const checks = {
  same(actual, expected) {
    return actual === expected;
  },

  equal(actual, expected) {
    return deepEqual(actual, expected);
  },

  truthy(value) {
    return !!value;
  },

  falsy(value) {
    return !value;
  },

  async throws(fn) {
    return new Promise((resolve) => {
      try {
        const result = fn();

        if (result instanceof Promise) {
          result
            .then(() => {
              resolve();
            })
            .catch((err) => {
              resolve(err);
            });
        } else {
          resolve();
        }
      } catch (err) {
        resolve(err);
      }
    });
  },

  called(mockFn) {
    if (isMockFn(mockFn)) {
      return mockFn.mock.calls.length > 0;
    } else {
      throw new TypeError(`Expected a mock function. Got: ${mockFn}`);
    }
  },

  calledWith(mockFn, argument) {
    if (isMockFn(mockFn)) {
      const arg = JSON.stringify(argument);

      for (const call of mockFn.mock.calls) {
        if (call.args.map((a) => JSON.stringify(a)).includes(arg)) {
          return true;
        }
      }

      return false;
    } else {
      throw new TypeError(`Expected a mock function. Got: ${mockFn}`);
    }
  },

  calledTimes(mockFn, count) {
    if (isMockFn(mockFn)) {
      return mockFn.mock.calls.length === count;
    } else {
      throw new TypeError(`Expected a mock function. Got: ${mockFn}`);
    }
  },
};

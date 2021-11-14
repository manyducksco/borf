/**
 * Returns an object with chainable methods for type assertions.
 *
 * @example
 * assert(variable).number().integer().between(100, 200);
 */
export function assert(value) {
  let optional = false;

  function test(fn) {
    const message = fn(value);

    if (message && !optional) {
      throw new TypeError(message);
    }
  }

  const helpers = {
    number: () => _number(test),
    string: () => _string(test),
    // object: (shape) => _object(value, shape),
    optional: () => {
      optional = true;
      return helpers;
    },
  };

  return helpers;
}

function _number(test) {
  test((value) => {
    if (typeof value !== "number") {
      return `Expected a number. Received: ${value}`;
    }
  });

  return {
    integer() {
      test((value) => {
        if (value % 1 !== 0) {
          return `Expected an integer. Received: ${value}`;
        }
      });

      return this;
    },
    float() {
      test((value) => {
        if (value % 1 === 0) {
          return `Expected a float. Received: ${value}`;
        }
      });

      return this;
    },
    min(target) {
      test((value) => {
        if (value < target) {
          return `Expected a number equal or greater than ${target}. Received: ${value}`;
        }
      });

      return this;
    },
    max(target) {
      test((value) => {
        if (value >= target) {
          return `Expected a number equal or less than ${target}. Received: ${value}`;
        }
      });

      return this;
    },
  };
}

function _string(test) {
  test((value) => {
    if (typeof value !== "string") {
      return `Expected a string. Received: ${value}`;
    }
  });

  return {
    min(target) {
      test((value) => {
        if (value < target) {
          return `Expected a number equal or greater than ${target}. Received: ${value}`;
        }
      });

      return this;
    },
    max(target) {
      test((value) => {
        if (value >= target) {
          return `Expected a number equal or less than ${target}. Received: ${value}`;
        }
      });

      return this;
    },
    length(target) {
      test((value) => {
        if (value.length !== target) {
          return `Expected a ${target} character string. Received: ${value}`;
        }
      });

      return this;
    },
  };
}

function _object(helpers) {
  return helpers;
}

function _array(helpers) {
  return helpers;
}

"use strict";

import util from "util";

import $$observable from "symbol-observable";
import DeepProxy from "proxy-deep";
import { flatMap } from "./helpers/flatMap.js";
import { cloneDeep } from "./helpers/cloneDeep.js";

// const Test = makeModel({
//   key: "id",
//   schema: {
//     id: Model.number()
//   }
// });

// const test = new Test({
//   id: 1,
// });

export class ModelError extends Error {}

export function makeModel({ key, schema, ...attrs }) {
  const $$model = Symbol("Model");

  if (key == null) {
    throw new ModelError("You must define a key for your model.");
  }

  if (schema == null) {
    throw new ModelError("You must define a schema function for your model.");
  }

  if (typeof schema !== "function") {
    throw new ModelError("Schema must be a function.");
  }

  schema = schema(Validators);

  if (!(schema instanceof ObjectValidator)) {
    throw new ModelError(
      "Schema function must return an .object() definition."
    );
  }

  if (typeof key === "string" && !schema._shape.hasOwnProperty(key)) {
    throw new Error(`Schema doesn't include key property '${key}'.`);
  }

  function validate(object) {
    const { errors } = schema._validate(object, { path: [] });

    return {
      valid: errors.length === 0,
      errors: errors.map((e) => {
        return {
          path: e.context.path,
          message: e.message,
          received: e.context.value,
        };
      }),
    };
  }

  function Model(data) {
    const observers = [];
    const model = {};

    const methods = {
      subscribe(observer) {
        if (typeof observer === "function") {
          observer = {
            next: observer,
            error: arguments[1],
            complete: arguments[2],
          };
        }

        observers.push(observer);

        return {
          unsubscribe: () => {
            observers.splice(observers.indexOf(observer), 1);
          },
        };
      },

      toObject() {
        const object = {};

        for (const key in schema) {
          if (model[key] !== undefined) {
            object[key] = model[key];
          }
        }

        return cloneDeep(object);
      },

      [$$observable]() {
        return this;
      },

      [$$model]: true,

      ...attrs,
    };

    Object.assign(model, cloneDeep(data), methods);

    const proxy = new DeepProxy(model, {
      get(object, prop) {
        let value = object[prop];

        // Return values from methods as is.
        if (this.path.length === 0 && Object.keys(methods).includes(prop)) {
          return value;
        }

        // Return a nested proxy for any data that can be mutated.
        if (typeof value === "object" && value != null) {
          value = this.nest(value);
        }

        return value;
      },
      set(object, prop, value) {
        const potential = model.toObject();
        let target = potential;

        for (const index of this.path) {
          target = target[index];
        }
        target[prop] = value;

        const { valid, errors } = validate(potential);

        // inspect({ potential, valid, errors });

        if (!valid) {
          const err = errors[0];
          throw new TypeError(`${pathToKey(err.path)} - ${err.error}`);
        }

        // Update and notify observers.
        object[prop] = value;
        for (const observer of observers) {
          observer.next(potential);
        }
      },
    });

    Object.setPrototypeOf(model, Model);

    return proxy;
  }

  Object.defineProperty(Model, "validate", {
    value: validate,
  });

  Object.defineProperty(Model, Symbol.hasInstance, {
    value: (instance) => {
      if (instance[$$model]) {
        return true;
      }

      return false;
    },
  });

  return Model;
}

/*============================*\
||         Validation         ||
\*============================*/

const Validators = {};

/* --- Primitive Types --- */

Validators.boolean = function boolean() {
  return new BooleanValidator();
};

Validators.func = function func() {
  return new FunctionValidator();
};

Validators.number = function number() {
  return new NumberValidator();
};

Validators.object = function object(schema) {
  return new ObjectValidator(schema);
};

Validators.string = function string() {
  return new StringValidator();
};

Validators.symbol = function symbol() {
  return new SymbolValidator();
};

/* --- Special Validators --- */

Validators.arrayOf = function arrayOf(...validators) {
  return new ArrayOfValidator(validators);
};

Validators.custom = function custom(fn) {
  return new Validator().refine(fn);
};

Validators.instanceOf = function instanceOf() {
  return new InstanceOfValidator();
};

Validators.oneOf = function oneOf(...validators) {
  return new OneOfValidator(validators);
};

Object.freeze(Validators);

class ValidatorError extends TypeError {
  constructor(message, context) {
    if (context == null) {
      throw new TypeError("Context is required");
    }

    super(message);

    this.context = context;
  }
}

class Validator {
  _isRequired = true;
  _isNullable = false;
  _isPresent = false;

  _refineFuncs = [];

  optional() {
    this._isRequired = false;
    return this;
  }

  nullable() {
    this._isNullable = true;
    return this;
  }

  /**
   * Refine validation with a function that takes the value and returns an error message if it fails validation.
   */
  refine(fn) {
    this._refineFuncs.push(fn);
    return this;
  }

  // Validator subclasses implement this method and return ValidatorErrors if things don't check out.
  _checkType(value, context) {
    return [];
  }

  _validate(value, context) {
    const errors = [];

    if (value !== undefined) {
      this._isPresent = true;
    }

    if (value === null && !this._isNullable) {
      errors.push(
        new ValidatorError("property is not nullable", { ...context, value })
      );
    }

    if (this._isRequired && !this._isPresent) {
      errors.push(
        new ValidatorError("property is required", { ...context, value })
      );
    }

    if (this._isPresent) {
      // Check type if value passes basic checks.
      const _errors = this._checkType(value, context);

      if (_errors.length > 0) {
        errors.push(..._errors);
      } else if (this._refineFuncs.length > 0) {
        // Refine if value passes type checking.
        for (const fn of this._refineFuncs) {
          const message = fn(value);

          if (message != null) {
            if (typeof message === "string") {
              errors.push(new ValidatorError(message, { ...context, value }));
            } else {
              throw new TypeError(
                `Refine function must return a string or null/undefined. Received ${getTypeNameWithArticle(
                  message
                )}.`
              );
            }
          }
        }
      }
    }

    return { errors };
  }
}

/* --- Primitive Types --- */

class BooleanValidator extends Validator {
  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "boolean") {
      errors.push(
        new ValidatorError(
          "expected a boolean; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    }

    return errors;
  }
}

class FunctionValidator extends Validator {
  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "function") {
      errors.push(
        new ValidatorError(
          "expected a function; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    }

    return errors;
  }
}

class NumberValidator extends Validator {
  _min = -Infinity;
  _max = Infinity;

  min(value) {
    this._min = value;
    return this;
  }

  max(value) {
    this._max = value;
    return this;
  }

  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "number") {
      errors.push(
        new ValidatorError(
          "expected a number; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    }

    return errors;
  }
}

class ObjectValidator extends Validator {
  _isStrict = false;

  constructor(object) {
    super();

    if (typeof object !== "object") {
      throw new TypeError("requires an object");
    }

    for (const key in object) {
      if (!(object[key] instanceof Validator)) {
        throw new TypeError(
          "ObjectValidator key '" + key + "' is not a validator."
        );
      }
    }

    this._shape = object;
  }

  /**
   * Consider unknown properties invalid.
   */
  strict() {
    this._isStrict = true;
    return this;
  }

  _checkType(value, context) {
    const errors = [];
    const type = getTypeName(value);

    if (type !== "object") {
      errors.push(
        new ValidatorError(
          "expected an object; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    } else {
      for (const key in this._shape) {
        const result = this._shape[key]._validate(value[key], {
          ...context,
          path: [...context.path, key],
        });

        // inspect({ key, value: value[key], validator: this._shape[key] });

        errors.push(...result.errors);
      }

      if (this._isStrict) {
        for (const key in value) {
          if (!this._shape.hasOwnProperty(key)) {
            errors.push(
              new ValidatorError("invalid property; not defined in schema", {
                ...context,
                value: value[key],
                path: [...context.path, key],
              })
            );
            continue;
          }
        }
      }
    }

    return errors;
  }
}

class StringValidator extends Validator {
  _pattern = null;

  pattern(regexp) {
    if (!(regexp instanceof RegExp)) {
      throw new TypeError("expected a regexp");
    }

    this._pattern = pattern;
    return this;
  }

  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "string") {
      errors.push(
        new ValidatorError(
          "expected a string; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    } else if (this._pattern) {
      if (!this._pattern.test(value)) {
        errors.push(
          new ValidatorError("string does not match expected pattern", {
            ...context,
            value,
          })
        );
      }
    }

    return errors;
  }
}

class SymbolValidator extends Validator {
  _checkType(value, context) {
    const errors = [];

    // TODO: See if this is sufficient for identifying symbols
    if (!(value instanceof Symbol)) {
      errors.push(
        new ValidatorError(
          "expected a symbol; received " + getTypeNameWithArticle(value)
        ),
        { ...context, value }
      );
    }

    return errors;
  }
}

/* --- Special Validators --- */

class ArrayOfValidator extends Validator {
  constructor(validators) {
    super();

    if (validators.length === 1) {
      this._itemValidator = validators[0];
    } else {
      this._itemValidator = new OneOfValidator(validators);
    }
  }

  _checkType(value, context) {
    const errors = [];

    if (!Array.isArray(value)) {
      errors.push(
        new ValidatorError(
          "expected an object; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    } else {
      for (let i = 0; i < value.length; i++) {
        const result = this._itemValidator._validate(value[i], {
          ...context,
          path: [...context.path, i],
        });

        // inspect({ item: value[i], result, validator: this._itemValidator });

        if (result.errors.length > 0) {
          errors.push(...result.errors);
        }
      }
    }

    return errors;
  }
}

class InstanceOfValidator extends Validator {
  constructor(ctor) {
    super();

    this._ctor = ctor;
  }

  _checkType(value, context) {
    const errors = [];

    if (!(value instanceof this._ctor)) {
      errors.push(
        new ValidatorError(
          "expected an instance of " +
            this._ctor.name +
            "; received " +
            getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    }

    return errors;
  }
}

class OneOfValidator extends Validator {
  constructor(validators) {
    super();

    validators = flatMap(validators);

    for (const validator of validators) {
      if (!(validator instanceof Validator)) {
        throw new TypeError("key '" + key + "' is not a validator");
      }
    }

    this._validators = validators;
  }

  _checkType(value, context) {
    const errors = [];
    let valid = false;

    for (const validator of this._validators) {
      const result = validator._validate(value, context);

      // inspect({ value, context, result });

      // Succeed on first validator that checks out.
      if (result.errors.length === 0) {
        valid = true;
        break;
      } else {
        errors.push(...result.errors);
      }
    }

    if (valid) {
      return [];
    } else {
      return errors;
    }
  }
}

/*============================*\
||           Helpers          ||
\*============================*/

function pathToKey(path) {
  let key = "";

  for (const entry of path) {
    if (typeof entry === "number") {
      key += `[${entry}]`;
    } else if (key.length === 0) {
      key += entry;
    } else {
      key += "." + entry;
    }
  }

  return key;
}

function getTypeName(value) {
  if (value === null || typeof value === "undefined") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (value instanceof Date) {
    return "date";
  }

  if (value instanceof RegExp) {
    return "regexp";
  }

  if (value instanceof Symbol) {
    return "symbol";
  }

  return typeof value;
}

function getTypeNameWithArticle(value) {
  const type = getTypeName(value);
  switch (type) {
    case "array":
    case "object":
      return "an " + type;
    case "boolean":
    case "date":
    case "function":
    case "number":
    case "regexp":
    case "string":
    case "symbol":
      return "a " + type;
    default:
      return type;
  }
}

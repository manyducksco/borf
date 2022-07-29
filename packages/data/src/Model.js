"use strict";

import util from "util";

import $$observable from "symbol-observable";
import DeepProxy from "proxy-deep";
import { flatMap } from "./helpers/flatMap.js";
import { cloneDeep } from "./helpers/cloneDeep.js";

/**
 * TODO
 * ----
 *
 * 1. Subclasses of Model don't have the right prototype chain because of the proxy object
 * 2. Methods on subclasses aren't accessible because of the same issue
 */

const inspect = (object) => {
  console.log(util.inspect(object, false, Infinity, true));
};

const $$constructor = Symbol("constructor");

export class Model extends CoreModel {
  static validate(data) {
    let schema = this.schema;

    if (!(schema instanceof ShapeValidator)) {
      schema = new ExactShapeValidator(schema);
    }

    const { errors } = schema._validate(data, { path: [] });

    return {
      valid: errors.length === 0,
      errors: errors.map((e) => {
        return {
          path: e.context.path,
          error: e.message,
          received: e.context.value,
        };
      }),
    };
  }

  static [Symbol.hasInstance](instance) {
    const instanceCtor = instance[$$constructor] && instance[$$constructor]();

    if (!instanceCtor) {
      return false;
    }

    // console.log(this, this.prototype);

    let proto = instanceCtor;

    let i = 0;
    while (proto != null) {
      // console.log({
      //   i: i++,
      //   self: this,
      //   selfParent: this.prototype,
      //   proto,
      //   protoParent: proto.prototype,
      //   protoCtor: proto.constructor,
      //   isInstance: proto === this,
      // });
      if (proto === this) {
        return true;
      }
      proto = proto.prototype;
    }

    return false;
  }
}

function CoreModel(data) {
  const ctor = this.constructor;
  const key = this.constructor.key;
  const schema = this.constructor.schema;

  // inspect(schema);

  // Object.setPrototypeOf(ctor, Model);

  if (key == null) {
    throw new Error("You must define a key for your model.");
  }

  if (schema == null) {
    throw new Error("You must define a schema for your model.");
  }

  if (typeof key === "string" && !schema.hasOwnProperty(key)) {
    throw new Error(`Schema doesn't include key property '${key}'.`);
  }

  const observers = [];
  const validate = makeValidate(schema);

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

    [$$constructor]() {
      return ctor;
    },
  };

  console.log(ctor);

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

  Object.setPrototypeOf(proxy, Model);

  return proxy;
}

Model.arrayOf = function arrayOf(...validators) {
  return new ArrayOfValidator(validators);
};

Model.oneOf = function oneOf(...validators) {
  return new OneOfValidator(validators);
};

Model.number = function number() {
  return new NumberValidator();
};

Model.string = function string() {
  return new StringValidator();
};

Model.boolean = function boolean() {
  return new BooleanValidator();
};

Model.shape = function shape(object) {
  return new ShapeValidator(object);
};

Model.exact = function exact(object) {
  return new ExactShapeValidator(object);
};

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

  optional() {
    this._isRequired = false;
    return this;
  }

  nullable() {
    this._isNullable = true;
    return this;
  }

  _validate(value, context) {
    const errors = [];

    if (value !== undefined) {
      this._isPresent = true;
    }

    if (value === null && !this._isNullable) {
      errors.push(
        new ValidatorError("field is not nullable", { ...context, value })
      );
    }

    if (this._isRequired && !this._isPresent) {
      errors.push(
        new ValidatorError("field is required", { ...context, value })
      );
    }

    return { errors };
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

  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];

    if (this._isPresent) {
      if (typeof value !== "number") {
        errors.push(
          new ValidatorError(
            "expected a number; received " + getTypeNameWithArticle(value),
            { ...context, value }
          )
        );
      }
    }

    return { errors };
  }
}

class BooleanValidator extends Validator {
  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];

    if (this._isPresent) {
      if (typeof value !== "boolean") {
        errors.push(
          new ValidatorError(
            "expected a boolean; received " + getTypeNameWithArticle(value),
            { ...context, value }
          )
        );
      }
    }

    return { errors };
  }
}

class StringValidator extends Validator {
  pattern(regexp) {
    if (!(regexp instanceof RegExp)) {
      throw new TypeError("expected a regexp");
    }

    this._pattern = pattern;
    return this;
  }

  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];

    if (this._isPresent) {
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
    }

    return { errors };
  }
}

class ArrayOfValidator extends Validator {
  constructor(validators) {
    super();

    if (validators.length === 1) {
      this._itemValidator = validators[0];
    } else {
      this._itemValidator = new OneOfValidator(validators);
    }
  }

  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];

    if (this._isPresent) {
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
    }

    return { errors };
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

  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];
    let valid = false;

    if (this._isPresent) {
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
    }

    if (valid) {
      return { errors: [] };
    } else {
      return { errors };
    }
  }
}

class ShapeValidator extends Validator {
  constructor(object) {
    super();

    if (typeof object !== "object") {
      throw new TypeError("Shape requires an object");
    }

    for (const key in object) {
      if (!(object[key] instanceof Validator)) {
        throw new TypeError(
          "Shape validator key '" + key + "' is not a validator."
        );
      }
    }

    this._shape = object;
  }

  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];

    if (this._isPresent) {
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
      }
    }

    return { errors };
  }
}

class ExactShapeValidator extends ShapeValidator {
  _validate(value, context) {
    const result = super._validate(value, context);
    const errors = [...result.errors];

    for (const key in value) {
      if (!this._shape.hasOwnProperty(key)) {
        errors.push(
          new ValidatorError("unknown field is not allowed", {
            ...context,
            value: value[key],
            path: [...context.path, key],
          })
        );
      }
    }

    return { errors };
  }
}

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

function makeValidate(schema) {
  if (!(schema instanceof ShapeValidator)) {
    schema = new ExactShapeValidator(schema);
  }

  return function validate(object) {
    const { errors } = schema._validate(object, { path: [] });

    return {
      valid: errors.length === 0,
      errors: errors.map((e) => {
        return {
          path: e.context.path,
          error: e.message,
        };
      }),
    };
  };
}

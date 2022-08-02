import $$observable from "symbol-observable";
import DeepProxy from "proxy-deep";
import { flatMap } from "./helpers/flatMap.js";
import { cloneDeep } from "./helpers/cloneDeep.js";

// const Test = makeModel({
//   key: "id",
//   schema: v => {
//     return v.object({
//       id: Model.number()
//     });
//   }
// });

// const test = new Test({
//   id: 1,
// });

export class ModelError extends Error {}

const $$typeModel = Symbol("type:model");
const $$typeRecord = Symbol("type:record");

export function isModel(object) {
  return object[$$typeModel] === $$typeModel;
}

export function isRecord(object) {
  return object[$$typeRecord] === $$typeRecord;
}

export function makeModel({ key, schema }) {
  const $$model = Symbol("Model");

  if (key == null) {
    throw new ModelError("You must define a key for your model.");
  }

  if (typeof key !== "string") {
    throw new ModelError("Key must be a string.");
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
      key: errors.length === 0 ? object[key] : undefined,
    };
  }

  function Model(data) {
    const _result = validate(data);

    if (!_result.valid) {
      const err = _result.errors[0];
      throw new ModelError(
        `${pathToKey(err.path)} - ${err.message}; received ${err.value}`
      );
    }

    const observers = [];
    const model = {
      ...cloneDeep(data),
    };

    // Non-data props attached to each model instance.
    const properties = {
      _key: {
        get() {
          return this[key];
        },
      },

      subscribe: {
        value: (observer) => {
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
      },

      toObject: {
        value: () => {
          const object = Object.create(null);

          const ignoreKeys = Object.keys(properties);
          for (const key in model) {
            if (key !== undefined && !ignoreKeys.includes(key)) {
              object[key] = model[key];
            }
          }

          return cloneDeep(object);
        },
      },

      [$$observable]: {
        value() {
          return this;
        },
      },

      [$$model]: {
        value: $$model,
      },

      [$$typeRecord]: {
        value: $$typeRecord,
      },
    };

    Object.defineProperties(model, properties);

    return new DeepProxy(model, {
      get(object, prop) {
        let value = object[prop];

        // Return values from modelProps as is.
        if (this.path.length === 0 && Object.keys(properties).includes(prop)) {
          return value;
        }

        if (isMutableType(value)) {
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

        if (!valid) {
          const err = errors[0];
          throw new TypeError(
            `${pathToKey(err.path)} - ${err.message}; received ${err.value}`
          );
        }

        // Update and notify observers.
        object[prop] = value;
        for (const observer of observers) {
          observer.next(potential);
        }
      },
    });
  }

  Object.defineProperties(Model, {
    validate: {
      value: validate,
      enumerable: true,
    },
    key: {
      value: key,
      enumerable: true,
    },
    [Symbol.hasInstance]: {
      value: (instance) => {
        if (instance[$$model] === $$model) {
          return true;
        }

        return false;
      },
    },
    [$$typeModel]: {
      value: $$typeModel,
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

Validators.instanceOf = function instanceOf(object) {
  return new InstanceOfValidator(object);
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

    this._pattern = regexp;
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

    this._validators = flatMap(validators);
  }

  _checkType(value, context) {
    const errors = [];
    let valid = false;

    for (const validator of this._validators) {
      if (validator instanceof Validator) {
        const result = validator._validate(value, context);

        // inspect({ value, context, result });

        // Succeed on first validator that checks out.
        if (result.errors.length === 0) {
          valid = true;
          break;
        } else {
          errors.push(...result.errors);
        }
      } else {
        // If not a validator, compare as a literal value.
        if (value === validator) {
          valid = true;
          break;
        } else {
          errors.push(
            new ValidatorError(
              "did not match expected values; received " +
                getTypeNameWithArticle(value),
              context
            )
          );
        }
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

function isMutableType(value) {
  return typeof value === "object" && value != null;
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

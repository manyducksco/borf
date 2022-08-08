import { flatMap } from "./helpers/flatMap.js";
import { pathToKey } from "./helpers/pathToKey.js";

/*============================*\
||         Validation         ||
\*============================*/

export const v = {};

/* --- Primitive Types --- */

v.boolean = function boolean() {
  return new BooleanValidator();
};

v.func = function func() {
  return new FunctionValidator();
};

v.number = function number() {
  return new NumberValidator();
};

v.object = function object(schema) {
  return new ObjectValidator(schema);
};

v.string = function string() {
  return new StringValidator();
};

v.symbol = function symbol() {
  return new SymbolValidator();
};

/* --- Special Validators --- */

v.arrayOf = function arrayOf(...validators) {
  return new ArrayOfValidator(validators);
};

v.custom = function custom(fn) {
  return new Validator().refine(fn);
};

v.instanceOf = function instanceOf(object) {
  return new InstanceOfValidator(object);
};

v.oneOf = function oneOf(...validators) {
  return new OneOfValidator(validators);
};

Object.freeze(v);

function makeValidationError(message, context) {
  return {
    path: context.path,
    message,
    received: context.value,
  };
}

class Validator {
  #isOptional = false;
  #isNullable = false;
  #isPresent = false;
  #refinements = [];

  optional() {
    this.#isOptional = true;
    return this;
  }

  nullable() {
    this.#isNullable = true;
    return this;
  }

  /**
   * Refine validation with a function that takes the value and returns an error message if it fails validation.
   */
  refine(fn) {
    this.#refinements.push(fn);
    return this;
  }

  // Validator subclasses implement this method and return ValidatorErrors if things don't check out.
  _checkType(value, context) {
    return [];
  }

  validate(value, context) {
    const errors = [];

    context = context || { path: [] };

    if (value !== undefined) {
      this.#isPresent = true;
    }

    if (!this.#isPresent && !this.#isOptional) {
      errors.push(
        makeValidationError("property is required", { ...context, value })
      );
    }

    if (this.#isPresent) {
      if (value === null) {
        if (!this.#isNullable) {
          errors.push(
            makeValidationError("property is not nullable", {
              ...context,
              value,
            })
          );
        }
      } else {
        // Check type if value passes basic checks.
        const _errors = this._checkType(value, context);

        if (_errors.length > 0) {
          errors.push(..._errors);
        } else if (this.#refinements.length > 0) {
          // Refine if value passes type checking.
          for (const fn of this.#refinements) {
            const message = fn(value);

            if (message != null) {
              if (typeof message === "string") {
                errors.push(
                  makeValidationError(message, { ...context, value })
                );
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
    }

    return { valid: errors.length === 0, errors };
  }

  assert(value) {
    const result = this.validate(value);

    if (!result.valid) {
      let message = "";
      const err = result.errors[0];

      if (err.path.length > 0) {
        message += "'" + pathToKey(err.path) + "': ";
      }

      message += err.message;
      message += ` (received ${String(err.received)})`;

      throw new TypeError(message);
    }
  }
}

/* --- Primitive Types --- */

class BooleanValidator extends Validator {
  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "boolean") {
      errors.push(
        makeValidationError(
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
        makeValidationError(
          "expected a function; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    }

    return errors;
  }
}

class NumberValidator extends Validator {
  min(value) {
    return this.refine((num) => {
      if (num < value) {
        return "value must be no less than " + value;
      }
    });
  }

  max(value) {
    return this.refine((num) => {
      if (num > value) {
        return "value must be no greater than " + value;
      }
    });
  }

  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "number") {
      errors.push(
        makeValidationError(
          "expected a number; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    }

    return errors;
  }
}

export class ObjectValidator extends Validator {
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
        makeValidationError(
          "expected an object; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    } else {
      for (const key in this._shape) {
        const result = this._shape[key].validate(value[key], {
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
              makeValidationError("invalid property; not defined in schema", {
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
  pattern(regexp) {
    if (!(regexp instanceof RegExp)) {
      throw new TypeError("expected a regexp");
    }

    return this.refine((value) => {
      if (!regexp.test(value)) {
        return "string does not match expected pattern";
      }
    });
  }

  /**
   * Validates that the string is in a valid ISO date format.
   */
  isoDate() {
    const regexp =
      /^(\d{4})-(\d{2})-(\d{2})T((\d{2}):(\d{2})(:\d{2})?)(\.\d{3})?(Z|[+-]\d{2}(:\d{2})?)$/;

    return this.refine((value) => {
      if (!regexp.test(value)) {
        return "expected a valid ISO 8601 date string";
      }
    });
  }

  /**
   * Validates that the string can be parsed as a date by JavaScript.
   */
  date() {
    return this.refine((value) => {
      if (isNaN(Date.parse(value))) {
        return "expected a valid date";
      }
    });
  }

  _checkType(value, context) {
    const errors = [];

    if (typeof value !== "string") {
      errors.push(
        makeValidationError(
          "expected a string; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
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
        makeValidationError(
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
        makeValidationError(
          "expected an object; received " + getTypeNameWithArticle(value),
          { ...context, value }
        )
      );
    } else {
      for (let i = 0; i < value.length; i++) {
        const result = this._itemValidator.validate(value[i], {
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
        makeValidationError(
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
        const result = validator.validate(value, context);

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
            makeValidationError(
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

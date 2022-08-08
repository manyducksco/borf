import $$observable from "symbol-observable";
import DeepProxy from "proxy-deep";
import { cloneDeep } from "./helpers/cloneDeep.js";
import { pathToKey } from "./helpers/pathToKey.js";
import { v, ObjectValidator } from "./v.js";

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

  if (typeof schema === "function") {
    schema = schema(v);
  }

  if (!(schema instanceof ObjectValidator)) {
    throw new ModelError("Schema must be a v.object() definition.");
  }

  if (typeof key === "string" && !schema._shape.hasOwnProperty(key)) {
    throw new Error(`Schema doesn't include key property '${key}'.`);
  }

  function validate(object) {
    const { errors } = schema.validate(object, { path: [] });

    return {
      valid: errors.length === 0,
      errors,
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
    schema: {
      value: schema,
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
||           Helpers          ||
\*============================*/

function isMutableType(value) {
  return typeof value === "object" && value != null;
}

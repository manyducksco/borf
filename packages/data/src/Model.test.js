import { Model } from "./Model";

// (function () {
//   const test = new Test({
//     id: 1,
//     name: "Bob",
//     hobbies: [{ activity: "Skiing" }, { activity: "Biking" }],
//   });

//   // test.other = 5;

//   // TODO: Last major issue to solve is that instanceof doesn't work correctly on models.
//   console.log("accessors", {
//     id: test.id,
//     name: test.name,
//     isTest: test instanceof Test,
//     isModel: test instanceof Model,
//   });

//   test.id = 2;
//   test.hobbies[1].activity = 5;

//   console.log("whole object", inspect(test, false, Infinity, true));
//   console.log("plain object", inspect(test.toObject(), false, Infinity, true));
// })();

class Example extends Model {
  static key = "id";

  static schema = {
    id: Model.number(),
  };

  get doubleId() {
    return this.id * 2;
  }
}

const ex = new Example();

console.log(ex);

describe("instantiation", () => {
  test("throws if key isn't defined", () => {
    class NoKey extends Model {}

    expect(() => {
      const _ = new NoKey();
    }).toThrow(/must define a key/i);
  });

  test("throws if schema isn't defined", () => {
    class NoSchema extends Model {
      static key = "id";
    }

    expect(() => {
      const _ = new NoSchema();
    }).toThrow(/must define a schema/i);
  });

  test("throws if schema doesn't include key", () => {
    class NoSchema extends Model {
      static key = "id";

      static schema = {
        name: Model.string(),
      };
    }

    expect(() => {
      const _ = new NoSchema();
    }).toThrow(/schema doesn't include key/i);
  });
});

describe("inheritance", () => {
  test("instanceof works correctly on subclasses", () => {
    class One extends Model {
      static key = "id";
      static schema = { id: Model.number() };
    }

    const one = new One({ id: 1 });
    expect(one).toBeInstanceOf(One);
    expect(one).toBeInstanceOf(Model);

    class Two extends One {
      static key = "id";
      static schema = { id: Model.number() };
    }

    const two = new Two({ id: 2 });
    expect(two).toBeInstanceOf(Two);
    expect(two).toBeInstanceOf(One);
    expect(two).toBeInstanceOf(Model);

    class Three extends Two {
      static key = "id";
      static schema = { id: Model.number() };
    }

    const three = new Three({ id: 3 });
    expect(three).toBeInstanceOf(Three);
    expect(three).toBeInstanceOf(Two);
    expect(three).toBeInstanceOf(One);
    expect(three).toBeInstanceOf(Model);
  });
});

describe("validation", () => {
  test("valid object", () => {
    class Test extends Model {
      static key = "id";

      static schema = {
        id: Model.number(),
        name: Model.string(),
        hobbies: Model.arrayOf(
          Model.shape({
            activity: Model.string(),
          })
        ),
        maybe: Model.boolean().optional(),
      };
    }

    const result = Test.validate({
      id: 1,
      name: "Bob",
      hobbies: [{ activity: "Skiing" }, { activity: "Biking" }],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  test("invalid object", () => {
    class Test extends Model {
      static key = "id";

      static schema = {
        id: Model.number(),
        name: Model.string(),
        hobbies: Model.arrayOf(
          Model.shape({
            activity: Model.string(),
          })
        ),
        maybe: Model.boolean().optional(),
      };
    }

    const fn = jest.fn();

    const result = Test.validate({
      id: "string",
      name: 5,
      hobbies: [
        { activity: Symbol("programming"), extra: "this is allowed" },
        [2],
      ],
      maybe: fn,
      wawawa: {},
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      {
        path: ["id"],
        error: "expected a number; received a string",
        received: "string",
      },
      {
        path: ["name"],
        error: "expected a string; received a number",
        received: 5,
      },
      {
        path: ["hobbies", 0, "activity"],
        error: "expected a string; received a symbol",
        received: Symbol("programming"),
      },
      {
        path: ["hobbies", 1],
        error: "expected an object; received an array",
        received: [2],
      },
      {
        path: ["maybe"],
        error: "expected a boolean; received a function",
        received: fn,
      },
      {
        path: ["wawawa"],
        error: "unknown field is not allowed",
        received: {},
      },
    ]);
  });
});

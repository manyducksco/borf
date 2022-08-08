import { makeModel } from "./makeModel.js";

describe("instantiation", () => {
  test("throws if key isn't defined", () => {
    expect(() => {
      const NoKey = makeModel({});
    }).toThrow(/must define a key/i);
  });

  test("throws if schema isn't defined", () => {
    expect(() => {
      const NoSchema = makeModel({
        key: "id",
      });
    }).toThrow(/must define a schema/i);
  });

  test("throws if schema doesn't include key", () => {
    expect(() => {
      const BadKey = makeModel({
        key: "id",
        schema(m) {
          return m
            .object({
              name: m.string(),
            })
            .strict();
        },
      });
    }).toThrow(/schema doesn't include key/i);
  });

  test("throws if schema isn't a function", () => {
    expect(() => {
      const BadSchemaType = makeModel({
        key: "id",
        schema: {
          name: "uh what",
        },
      });
    }).toThrow("must be a v.object()");
  });

  test("throws if schema function doesn't return an object validator", () => {
    expect(() => {
      const BadSchemaType = makeModel({
        key: "id",
        schema: (m) => {
          return m.number();
        },
      });
    }).toThrow("must be a v.object()");
  });
});

describe("instanceof", () => {
  test("instanceof identifies models as an instance of itself", () => {
    const One = makeModel({
      key: "id",
      schema(m) {
        return m
          .object({
            id: m.number(),
          })
          .strict();
      },
    });

    const Two = makeModel({
      key: "id",
      schema(m) {
        return m
          .object({
            id: m.number(),
          })
          .strict();
      },
    });

    const one = new One({ id: 1 });
    const two = new Two({ id: 2 });

    expect(one).toBeInstanceOf(One);
    expect(one).not.toBeInstanceOf(Two);

    expect(two).toBeInstanceOf(Two);
    expect(two).not.toBeInstanceOf(One);
  });
});

describe("validation", () => {
  test("valid object", () => {
    const Test = makeModel({
      key: "id",
      schema(m) {
        return m.object({
          id: m.number(),
          name: m.string(),
          hobbies: m.arrayOf(
            m.object({
              activity: m.string(),
            })
          ),
          maybe: m.boolean().optional(),
        });
      },
    });

    const result = Test.validate({
      id: 1,
      name: "Bob",
      hobbies: [{ activity: "Skiing" }, { activity: "Biking" }],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  test("invalid object", () => {
    const Test = makeModel({
      key: "id",
      schema(m) {
        return m
          .object({
            id: m.number(),
            name: m.string(),
            hobbies: m.arrayOf(
              m.object({
                activity: m.string(),
              })
            ),
            maybe: m.boolean().optional(),
          })
          .strict();
      },
    });

    const fn = () => {};
    const symbolProgramming = Symbol("programming");

    const result = Test.validate({
      id: "string",
      name: 5,
      hobbies: [{ activity: symbolProgramming, extra: "this is allowed" }, [2]],
      maybe: fn,
      wawawa: {},
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      {
        path: ["id"],
        message: "expected a number; received a string",
        received: "string",
      },
      {
        path: ["name"],
        message: "expected a string; received a number",
        received: 5,
      },
      {
        path: ["hobbies", 0, "activity"],
        message: "expected a string; received a symbol",
        received: symbolProgramming,
      },
      {
        path: ["hobbies", 1],
        message: "expected an object; received an array",
        received: [2],
      },
      {
        path: ["maybe"],
        message: "expected a boolean; received a function",
        received: fn,
      },
      {
        path: ["wawawa"],
        message: "invalid property; not defined in schema",
        received: {},
      },
    ]);
  });
});

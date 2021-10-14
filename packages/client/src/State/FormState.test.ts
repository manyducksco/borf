import { FormState } from "./FormState";
import { State } from "./State";

describe("constructor", () => {
  test("extends State", () => {
    const form = new FormState({
      fields: {
        test: "5",
      },
    });

    expect(form instanceof State).toBe(true);
  });

  test("takes fields as initial values", () => {
    const form = new FormState({
      fields: {
        firstName: "Bob",
        lastName: "Jones",
        age: 50,
      },
    });

    expect(form.current).toStrictEqual({
      firstName: "Bob",
      lastName: "Jones",
      age: 50,
    });
  });
});

describe("validation", () => {
  test("a", () => {
    const form = new FormState({
      fields: {
        firstName: "Bob",
        lastName: "Jones",
      },
      names: {
        firstName: "First name",
        lastName: "Last name",
      },
      validate: {
        firstName: (value) => {
          if (typeof value !== "string") {
            return "must be a string";
          }

          if (value.length < 5) {
            return "must be at least 5 characters";
          }
        },
        lastName: (value) => {
          if (typeof value !== "string") {
            return "must be a string";
          }

          if (value.length < 5) {
            return "must be at least 5 characters";
          }
        },
      },
    });

    expect(form.current.firstName).toBe("Bob");
    expect(form.current.lastName).toBe("Jones");
    expect(form.isValid).toBe(false);
    expect(form.errors.current.length).toBe(1);

    form.set("lastName", 5);

    expect(form.errors.current.length).toBe(2);

    expect(form.errors.current[0].message).toBe(
      "First name must be at least 5 characters"
    );
    expect(form.errors.current[1].message).toBe("Last name must be a string");
  });
});

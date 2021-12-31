import { getProperty } from "./getProperty";

test("reads nested properties from an object or array", () => {
  const data = {
    name: {
      first: "Frank",
      last: "Sinatra",
    },
    friends: [
      {
        name: {
          first: "Dean",
          last: "Martin",
        },
      },
      {
        name: {
          first: "Sammy",
          last: "Davis Jr.",
        },
      },
      {
        name: {
          first: "Peter",
          last: "Lawford",
        },
      },
      {
        name: {
          first: "Joey",
          last: "Bishop",
        },
      },
    ],
  };

  expect(getProperty(data, "name.first")).toBe("Frank");
  expect(getProperty(data, "does.not.exist")).toBe(undefined);
  expect(getProperty(data, "friends[1].name.first")).toBe("Sammy");

  const list = [1, 2, 3, 4, { value: 5 }];

  expect(getProperty(list, 2)).toBe(3);
  expect(getProperty(list, "[4].value")).toBe(5);
});

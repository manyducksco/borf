import { makeModel } from "./makeModel.js";
import { collectionOf } from "./collectionOf.js";

const User = makeModel({
  key: "id",
  schema(v) {
    return v
      .object({
        id: v.number(),
        name: v.string(),
        status: v.oneOf("online", "offline"),
      })
      .strict();
  },
});

test("exports", () => {
  const Users = collectionOf(User);

  expect(typeof Users.get).toBe("function");
  expect(typeof Users.set).toBe("function");
  expect(typeof Users.delete).toBe("function");
  expect(typeof Users.clear).toBe("function");
  expect(typeof Users.find).toBe("function");
  expect(typeof Users.filter).toBe("function");
});

test("get, set and delete", async () => {
  const Users = collectionOf(User);

  expect(await Users.get(1)).toBe(undefined);

  await Users.set({
    id: 1,
    name: "Test",
    status: "offline",
  });

  expect(await Users.get(1)).toStrictEqual({
    id: 1,
    name: "Test",
    status: "offline",
  });

  await Users.delete(1);

  expect(await Users.get(1)).toBe(undefined);
});

test("is iterable", async () => {
  const Users = collectionOf(User);

  await Users.set(
    {
      id: 1,
      name: "Test",
      status: "offline",
    },
    {
      id: 2,
      name: "Test 2",
      status: "online",
    },
    {
      id: 3,
      name: "Test 3",
      status: "offline",
    }
  );

  let iterations = 0;

  for (const user of Users) {
    iterations += 1;
  }

  expect(iterations).toBe(3);
});
